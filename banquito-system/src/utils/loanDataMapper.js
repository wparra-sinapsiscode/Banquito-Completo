/**
 * Mapear datos de préstamos del backend (snake_case) al formato que espera el frontend
 */
import { formatLocalDate } from './dateUtils';

// Función auxiliar para obtener el próximo miércoles
const getNextWednesday = (date) => {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  
  let daysToAdd;
  if (dayOfWeek === 3) {
    daysToAdd = 7; // Si ya es miércoles, el próximo es en 7 días
  } else if (dayOfWeek < 3) {
    daysToAdd = 3 - dayOfWeek; // Días hasta el miércoles de esta semana
  } else {
    daysToAdd = 10 - dayOfWeek; // Días hasta el miércoles de la próxima semana
  }
  
  d.setDate(d.getDate() + daysToAdd);
  return d;
};

export const mapLoanFromBackend = (backendLoan) => {
  if (!backendLoan) return null;
  
  console.log(`🔍 Mapeando préstamo ID ${backendLoan.id}:`, {
    original_amount: backendLoan.original_amount,
    remaining_amount_backend: backendLoan.remaining_amount,
    monthly_interest_rate: backendLoan.monthly_interest_rate,
    total_weeks: backendLoan.total_weeks,
    payments_count: backendLoan.payments?.length || 0
  });
  
  // Calcular saldo pendiente correcto
  const totalPaid = (backendLoan.payments || []).reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
  const originalAmount = backendLoan.original_amount || 0;
  const monthlyInterestRate = backendLoan.monthly_interest_rate || 0;
  const totalWeeks = backendLoan.total_weeks || backendLoan.installments || 0;
  
  console.log(`💰 Cálculo de saldo - Préstamo ${backendLoan.id}:`, {
    totalPaid,
    originalAmount,
    monthlyInterestRate,
    totalWeeks
  });
  
  // Calcular monto total con intereses usando la fórmula del backend
  let totalAmountWithInterest = originalAmount;
  if (monthlyInterestRate > 0 && totalWeeks > 0) {
    const totalMonths = Math.ceil(totalWeeks / 4);
    const TEM = monthlyInterestRate / 100;
    const potencia = Math.pow(1 + TEM, totalMonths);
    const monthlyPayment = originalAmount * (TEM * potencia) / (potencia - 1);
    totalAmountWithInterest = Math.round(monthlyPayment * totalMonths * 100) / 100;
    
    console.log(`📊 Cálculo de intereses - Préstamo ${backendLoan.id}:`, {
      totalMonths,
      TEM,
      potencia,
      monthlyPayment,
      totalAmountWithInterest
    });
  } else if (backendLoan.weekly_payment && totalWeeks > 0) {
    // Si no hay tasa de interés, calcular el total basado en el pago semanal
    totalAmountWithInterest = Math.round(backendLoan.weekly_payment * totalWeeks * 100) / 100;
    console.log(`📊 Cálculo sin intereses - Préstamo ${backendLoan.id}: ${backendLoan.weekly_payment} x ${totalWeeks} = ${totalAmountWithInterest}`);
  }
  
  const correctRemainingAmount = Math.round(Math.max(0, totalAmountWithInterest - totalPaid) * 100) / 100;
  
  console.log(`✅ Saldo pendiente calculado - Préstamo ${backendLoan.id}:`, {
    totalAmountWithInterest,
    totalPaid,
    correctRemainingAmount,
    backendRemainingAmount: backendLoan.remaining_amount
  });
  
  return {
    // Campos básicos
    id: backendLoan.id,
    memberId: backendLoan.member_id,
    memberName: backendLoan.member?.name || 'Sin nombre',
    
    // Montos
    originalAmount: originalAmount,
    remainingAmount: correctRemainingAmount, // Usar cálculo correcto
    totalAmountWithInterest: totalAmountWithInterest,
    
    // Pagos
    weeklyPayment: backendLoan.weekly_payment || 0,
    monthlyPayment: backendLoan.monthly_payment || 0,
    
    // Fechas
    startDate: backendLoan.start_date,
    dueDate: backendLoan.due_date,
    createdAt: backendLoan.created_at,
    updatedAt: backendLoan.updated_at,
    
    // Estructura de pago
    totalWeeks: backendLoan.total_weeks || backendLoan.installments || 0,
    installments: backendLoan.installments || backendLoan.total_weeks || 0,
    
    // Estado y tipo
    status: backendLoan.status,
    type: backendLoan.type || 'weekly',
    
    // Tasas
    interestRate: backendLoan.interest_rate || backendLoan.monthly_interest_rate || 0,
    monthlyInterestRate: backendLoan.monthly_interest_rate || backendLoan.interest_rate || 0,
    
    // Calcular semana actual basado en historial de pagos
    currentWeek: calculateCurrentWeek(backendLoan),
    currentInstallment: calculateCurrentWeek(backendLoan),
    
    // Datos relacionados
    member: backendLoan.member ? {
      id: backendLoan.member.id,
      name: backendLoan.member.name,
      dni: backendLoan.member.dni,
      creditRating: backendLoan.member.credit_rating,
      creditScore: backendLoan.member.credit_score
    } : null,
    
    // Historial de pagos mapeado
    paymentHistory: mapPaymentHistory(backendLoan.payments || []),
    
    // Generar cronograma de pagos si no existe
    paymentSchedule: generatePaymentSchedule(backendLoan),
    
    // Campos originales del backend para referencia
    _backend: backendLoan
  };
};

/**
 * Calcular la semana actual basado en el historial de pagos
 */
const calculateCurrentWeek = (loan) => {
  const paymentsCount = (loan.payments || []).length;
  return paymentsCount + 1;
};

/**
 * Mapear historial de pagos del backend
 */
const mapPaymentHistory = (backendPayments) => {
  return (backendPayments || []).map(payment => ({
    id: payment.id,
    amount: payment.amount || 0,
    date: payment.payment_date,
    lateFee: payment.late_fee || 0,
    notes: payment.notes,
    createdAt: payment.created_at
  }));
};

/**
 * Generar cronograma de pagos básico
 */
const generatePaymentSchedule = (loan) => {
  const schedule = [];
  
  // Validar datos básicos antes de proceder
  if (!loan) return schedule;
  
  const totalWeeks = loan.total_weeks || loan.installments || 12;
  const weeklyPayment = loan.weekly_payment || 0;
  
  // Validar fecha de inicio
  let startDate;
  if (loan.start_date) {
    startDate = new Date(loan.start_date);
  } else if (loan.created_at) {
    startDate = new Date(loan.created_at);
  } else {
    // Fallback a fecha actual si no hay fecha de inicio
    startDate = new Date();
  }
  
  // Verificar que la fecha es válida
  if (isNaN(startDate.getTime())) {
    console.warn('⚠️ Fecha de inicio inválida para préstamo:', loan.id, 'usando fecha actual');
    startDate = new Date();
  }
  
  // Calcular el primer miércoles
  let currentWednesday = getNextWednesday(startDate);
  
  for (let week = 1; week <= totalWeeks; week++) {
    // Usar el miércoles actual para esta semana
    const dueDate = new Date(currentWednesday);
    
    // Verificar que la fecha calculada es válida
    if (isNaN(dueDate.getTime())) {
      console.warn('⚠️ Fecha de vencimiento inválida para semana:', week, 'en préstamo:', loan.id);
      continue;
    }
    
    schedule.push({
      week: week,
      dueDate: formatLocalDate(dueDate),
      amount: weeklyPayment,
      weeklyPayment: weeklyPayment,
      weeklyCapital: weeklyPayment * 0.8, // Estimado
      weeklyInterest: weeklyPayment * 0.2, // Estimado
      remainingBalance: Math.max(0, (loan.original_amount || 0) - (weeklyPayment * 0.8 * week))
    });
    
    // Avanzar al siguiente miércoles (7 días después)
    currentWednesday.setDate(currentWednesday.getDate() + 7);
  }
  
  return schedule;
};

/**
 * Mapear múltiples préstamos del backend
 */
export const mapLoansFromBackend = (backendLoans) => {
  if (!Array.isArray(backendLoans)) return [];
  return backendLoans.map(mapLoanFromBackend).filter(Boolean);
};

/**
 * Mapear datos de miembro del backend
 */
export const mapMemberFromBackend = (backendMember) => {
  if (!backendMember) return null;
  
  try {
    return {
      id: backendMember.id,
      name: backendMember.name,
      dni: backendMember.dni,
      shares: backendMember.shares || 0,
      guarantee: backendMember.guarantee || 0,
      creditRating: backendMember.credit_rating,
      creditScore: backendMember.credit_score,
      phone: backendMember.phone,
      email: backendMember.email,
      createdAt: backendMember.created_at,
      updatedAt: backendMember.updated_at,
      
      // Datos relacionados
      savingsPlan: backendMember.savingsPlan,
      user: backendMember.user,
      
      // Solo procesar préstamos si existen y no causan errores
      loans: []  // Por ahora no procesar préstamos para evitar errores de fecha
    };
  } catch (error) {
    console.error('❌ Error mapeando miembro:', backendMember.id, error);
    return null;
  }
};