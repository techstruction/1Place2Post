import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class SupportService {
    constructor(private prisma: PrismaService, private notifications: NotificationService) { }

    async createTicket(userId: string, subject: string, message: string) {
        const ticket = await this.prisma.supportTicket.create({
            data: { userId, subject, messages: { create: { sender: 'USER', message } } },
            include: { messages: true },
        });
        await this.notifications.notify(userId, 'SUPPORT', '🎫 Support ticket created', subject, { ticketId: ticket.id });
        return ticket;
    }

    findAll(userId: string) {
        return this.prisma.supportTicket.findMany({
            where: { userId },
            include: { messages: { orderBy: { createdAt: 'asc' }, take: 1 } },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async findOne(userId: string, id: string) {
        const ticket = await this.prisma.supportTicket.findUnique({ where: { id }, include: { messages: { orderBy: { createdAt: 'asc' } } } });
        if (!ticket) throw new NotFoundException();
        if (ticket.userId !== userId) throw new ForbiddenException();
        return ticket;
    }

    async addMessage(userId: string, ticketId: string, message: string) {
        const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
        if (!ticket) throw new NotFoundException();
        if (ticket.userId !== userId) throw new ForbiddenException();
        if (ticket.status === 'CLOSED') throw new BadRequestException('Ticket is closed');
        const [msg] = await this.prisma.$transaction([
            this.prisma.supportMessage.create({ data: { ticketId, sender: 'USER', message } }),
            this.prisma.supportTicket.update({ where: { id: ticketId }, data: { updatedAt: new Date() } }),
        ]);
        return msg;
    }

    async closeTicket(userId: string, id: string) {
        const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
        if (!ticket) throw new NotFoundException();
        if (ticket.userId !== userId) throw new ForbiddenException();
        const updated = await this.prisma.supportTicket.update({ where: { id }, data: { status: 'CLOSED' } });
        await this.notifications.notify(userId, 'SUPPORT', '✅ Ticket closed', ticket.subject, { ticketId: id });
        return updated;
    }
}
