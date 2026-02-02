import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import * as XLSX from 'npm:xlsx';

/**
 * Exporta relatório de compliance em formato Excel
 * Inclui múltiplas planilhas: Resumo, Feedbacks, Colaboradores em Risco, Matriz de Aderência
 * 
 * ADMIN-ONLY: Esta função deve ser invocada apenas por administradores
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        if (user.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const payload = await req.json();
        const { start_date, end_date, department, manager_id } = payload || {};

        // Buscar dados
        const [users, feedbacks, justifications] = await Promise.all([
            base44.asServiceRole.entities.User.list(),
            base44.asServiceRole.entities.FeedbackRecord.list(),
            base44.asServiceRole.entities.Justification.list()
        ]);

        const activeUsers = users.filter(u => u.status === 'active');

        // Filtrar feedbacks por período se especificado
        let filteredFeedbacks = feedbacks;
        if (start_date && end_date) {
            filteredFeedbacks = feedbacks.filter(f => {
                const feedbackDate = new Date(f.feedback_date);
                return feedbackDate >= new Date(start_date) && feedbackDate <= new Date(end_date);
            });
        }

        // Filtrar por departamento
        if (department) {
            const deptUserIds = users.filter(u => u.department === department).map(u => u.id);
            filteredFeedbacks = filteredFeedbacks.filter(f => deptUserIds.includes(f.employee_id));
        }

        // Filtrar por gestor
        if (manager_id) {
            filteredFeedbacks = filteredFeedbacks.filter(f => f.manager_id === manager_id);
        }

        // Calcular usuários em risco
        const today = new Date();
        const usersAtRisk = activeUsers.filter(u => {
            if (!u.last_feedback_date) return true;
            const daysSince = Math.floor((today - new Date(u.last_feedback_date)) / (1000 * 60 * 60 * 24));
            return daysSince > 90;
        }).map(u => ({
            'Nome': u.full_name,
            'Email': u.email,
            'Cargo': u.position || '-',
            'Departamento': u.department || '-',
            'Último Feedback': u.last_feedback_date || 'Nunca',
            'Dias sem Feedback': u.last_feedback_date 
                ? Math.floor((today - new Date(u.last_feedback_date)) / (1000 * 60 * 60 * 24))
                : 'N/A'
        }));

        // Preparar dados de feedbacks
        const feedbacksData = filteredFeedbacks.map(f => ({
            'Colaborador': f.employee_name,
            'Email': f.employee_email,
            'Gestor': f.manager_name,
            'Data Realização': f.feedback_date,
            'Tipo': f.feedback_type === 'feedback' ? 'Feedback' : f.feedback_type === 'one_on_one' ? '1:1' : 'Avaliação',
            'Status': f.validation_status === 'pending' ? 'Pendente' : 
                     f.validation_status === 'accepted' ? 'Aceito' :
                     f.validation_status === 'contested' ? 'Contestado' : 'Expirado',
            'Pontos Fortes': f.strengths,
            'Pontos de Melhoria': f.improvements,
            'Plano de Ação': f.action_plan || '-'
        }));

        // Matriz de aderência por gestor
        const managers = users.filter(u => u.role === 'admin');
        const adherenceData = managers.map(manager => {
            const teamMembers = activeUsers.filter(u => u.manager_id === manager.id);
            const teamFeedbacks = filteredFeedbacks.filter(f => f.manager_id === manager.id);
            const teamWithFeedback = teamMembers.filter(member => {
                if (!member.last_feedback_date) return false;
                const daysSince = Math.floor((today - new Date(member.last_feedback_date)) / (1000 * 60 * 60 * 24));
                return daysSince <= 90;
            });

            return {
                'Gestor': manager.full_name,
                'Tamanho da Equipe': teamMembers.length,
                'Total de Feedbacks': teamFeedbacks.length,
                'Equipe em Dia': teamWithFeedback.length,
                'Equipe em Risco': teamMembers.length - teamWithFeedback.length,
                'Taxa de Aderência': teamMembers.length > 0
                    ? `${Math.round((teamWithFeedback.length / teamMembers.length) * 100)}%`
                    : '0%'
            };
        }).filter(m => m['Tamanho da Equipe'] > 0);

        // Resumo executivo
        const summary = [{
            'Métrica': 'Total de Colaboradores Ativos',
            'Valor': activeUsers.length
        }, {
            'Métrica': 'Total de Feedbacks Registrados',
            'Valor': filteredFeedbacks.length
        }, {
            'Métrica': 'Feedbacks Aceitos',
            'Valor': filteredFeedbacks.filter(f => f.validation_status === 'accepted').length
        }, {
            'Métrica': 'Feedbacks Pendentes',
            'Valor': filteredFeedbacks.filter(f => f.validation_status === 'pending').length
        }, {
            'Métrica': 'Feedbacks Contestados',
            'Valor': filteredFeedbacks.filter(f => f.validation_status === 'contested').length
        }, {
            'Métrica': 'Colaboradores em Risco (>90 dias)',
            'Valor': usersAtRisk.length
        }, {
            'Métrica': 'Taxa de Compliance Geral',
            'Valor': activeUsers.length > 0 
                ? `${Math.round(((activeUsers.length - usersAtRisk.length) / activeUsers.length) * 100)}%`
                : '0%'
        }];

        // Criar workbook
        const workbook = XLSX.utils.book_new();

        // Adicionar planilhas
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summary), 'Resumo Executivo');
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(feedbacksData), 'Feedbacks');
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(usersAtRisk), 'Colaboradores em Risco');
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(adherenceData), 'Matriz de Aderência');

        // Gerar arquivo Excel
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        return new Response(excelBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=compliance-report-${new Date().toISOString().split('T')[0]}.xlsx`
            }
        });

    } catch (error) {
        console.error('Error exporting report:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});