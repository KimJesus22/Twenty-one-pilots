import { useCallback } from 'react';
import { useNotifications } from './useNotifications';

export function useOrderNotifications() {
  const { createNotification } = useNotifications();

  // Crear notificación para cambio de estado de pedido
  const notifyOrderStatusChange = useCallback(async (orderId, orderNumber, oldStatus, newStatus, additionalData = {}) => {
    const statusMessages = {
      pending: 'Tu pedido está pendiente de confirmación',
      confirmed: 'Tu pedido ha sido confirmado',
      processing: 'Tu pedido está siendo procesado',
      shipped: 'Tu pedido ha sido enviado',
      delivered: 'Tu pedido ha sido entregado',
      cancelled: 'Tu pedido ha sido cancelado',
      refunded: 'Tu pedido ha sido reembolsado',
      completed: 'Tu pedido ha sido completado'
    };

    const message = statusMessages[newStatus] || `Estado del pedido actualizado: ${newStatus}`;

    try {
      await createNotification({
        type: 'order_status_update',
        title: `Pedido ${orderNumber} - Estado actualizado`,
        message: message,
        priority: newStatus === 'delivered' ? 'high' : 'normal',
        data: {
          orderId,
          orderNumber,
          oldStatus,
          newStatus,
          ...additionalData
        },
        channels: ['in_app', 'email', 'push']
      });
    } catch (error) {
      console.error('Error creating order status notification:', error);
    }
  }, [createNotification]);

  // Crear notificación para actualización de envío
  const notifyShippingUpdate = useCallback(async (orderId, orderNumber, trackingNumber, status, description, location = null) => {
    const shippingMessages = {
      picked_up: 'Tu pedido ha sido recogido por el transportista',
      in_transit: 'Tu pedido está en tránsito',
      out_for_delivery: 'Tu pedido está siendo entregado',
      delivered: 'Tu pedido ha sido entregado exitosamente',
      failed: 'Hubo un problema con la entrega de tu pedido',
      returned: 'Tu pedido ha sido devuelto al remitente'
    };

    const message = shippingMessages[status] || description || `Actualización de envío: ${status}`;

    const locationText = location ? ` en ${location.city}, ${location.state}` : '';

    try {
      await createNotification({
        type: 'shipping_update',
        title: `Envío ${trackingNumber} - Actualización`,
        message: message + locationText,
        priority: status === 'delivered' ? 'high' : status === 'failed' ? 'high' : 'normal',
        data: {
          orderId,
          orderNumber,
          trackingNumber,
          status,
          description,
          location
        },
        channels: ['in_app', 'push'] // Email opcional para shipping updates
      });
    } catch (error) {
      console.error('Error creating shipping notification:', error);
    }
  }, [createNotification]);

  // Crear notificación para pedido retrasado
  const notifyOrderDelayed = useCallback(async (orderId, orderNumber, estimatedDelivery, reason = '') => {
    const message = `Tu pedido ${orderNumber} está retrasado. Nueva fecha estimada: ${new Date(estimatedDelivery).toLocaleDateString('es-ES')}`;

    try {
      await createNotification({
        type: 'order_delay',
        title: 'Pedido retrasado',
        message: message + (reason ? ` - ${reason}` : ''),
        priority: 'high',
        data: {
          orderId,
          orderNumber,
          estimatedDelivery,
          reason
        },
        channels: ['in_app', 'email', 'push']
      });
    } catch (error) {
      console.error('Error creating delay notification:', error);
    }
  }, [createNotification]);

  // Crear notificación para reembolso procesado
  const notifyRefundProcessed = useCallback(async (orderId, orderNumber, amount, reason = '') => {
    try {
      await createNotification({
        type: 'refund_processed',
        title: 'Reembolso procesado',
        message: `Se ha procesado un reembolso de ${amount} para el pedido ${orderNumber}${reason ? ` - ${reason}` : ''}`,
        priority: 'high',
        data: {
          orderId,
          orderNumber,
          amount,
          reason
        },
        channels: ['in_app', 'email']
      });
    } catch (error) {
      console.error('Error creating refund notification:', error);
    }
  }, [createNotification]);

  return {
    notifyOrderStatusChange,
    notifyShippingUpdate,
    notifyOrderDelayed,
    notifyRefundProcessed
  };
}