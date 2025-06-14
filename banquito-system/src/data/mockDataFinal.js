export const initialUsers = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: 'Administrador' },
  { id: 2, username: 'arteaga', password: 'arteaga123', role: 'member', name: 'Arteaga', memberId: 1 },
  { id: 7, username: 'externo1', password: 'ext123', role: 'external', name: 'Cliente Externo 1' }
];

export const initialMembersData = [
  { id: 1, name: 'Arteaga', dni: '12345678', shares: 10, guarantee: 5000, creditRating: 'green', creditScore: 90, phone: '987654321', email: 'arteaga@email.com' }
];

// Agregar plan de ahorro a todos los socios
export const membersWithSavings = initialMembersData.map((member) => ({
  ...member,
  savingsPlan: {
    enabled: true,
    planDays: 180, // Por defecto 6 meses
    startDate: '2024-01-01',
    TEA: 0.02 // 2% TEA
  }
}));

// Función para determinar la calificación crediticia basada en el puntaje
export const getCreditRatingFromScore = (creditScore) => {
  if (creditScore >= 61 && creditScore <= 90) return 'green';
  if (creditScore >= 31 && creditScore <= 60) return 'yellow';
  if (creditScore >= 1 && creditScore <= 30) return 'red';
  return 'red';
};

// Función para obtener el texto descriptivo del puntaje
export const getCreditScoreDescription = (creditScore) => {
  if (creditScore >= 61 && creditScore <= 90) return 'Excelente';
  if (creditScore >= 31 && creditScore <= 60) return 'Regular';
  if (creditScore >= 1 && creditScore <= 30) return 'Riesgo Alto';
  return 'Sin Calificar';
};

// Función para encontrar el próximo miércoles desde una fecha dada
const getNextWednesday = (date) => {
  // Manejar correctamente la zona horaria
  let d;
  if (typeof date === 'string' && date.includes('-')) {
    // Si es una fecha ISO string (YYYY-MM-DD), crear la fecha en hora local
    const [year, month, day] = date.split('T')[0].split('-').map(Number);
    d = new Date(year, month - 1, day, 12, 0, 0); // Usar mediodía para evitar problemas de zona horaria
  } else {
    d = new Date(date);
  }
  
  const dayOfWeek = d.getDay(); // 0 = domingo, 1 = lunes, ..., 3 = miércoles, ..., 6 = sábado
  
  console.log('🗓️ getNextWednesday - Input:', {
    inputDate: date,
    parsedDate: d.toLocaleDateString('es-ES'),
    dayOfWeek: dayOfWeek,
    dayName: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][dayOfWeek]
  });
  
  let daysToAdd;
  
  // Calcular días hasta el próximo miércoles
  if (dayOfWeek === 3) {
    // Si es miércoles, ir al siguiente miércoles (7 días)
    daysToAdd = 7;
  } else if (dayOfWeek < 3) {
    // Domingo (0), Lunes (1), Martes (2): ir al miércoles de esta semana
    daysToAdd = 3 - dayOfWeek;
  } else {
    // Jueves (4), Viernes (5), Sábado (6): ir al miércoles de la próxima semana
    daysToAdd = 10 - dayOfWeek;
  }
  
  d.setDate(d.getDate() + daysToAdd);
  
  console.log('✅ getNextWednesday - Output:', {
    resultDate: d.toISOString().split('T')[0],
    localDate: d.toLocaleDateString('es-ES'),
    daysAdded: daysToAdd,
    resultDayOfWeek: d.getDay(),
    resultDayName: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][d.getDay()],
    isWednesday: d.getDay() === 3
  });
  
  return d;
};

// SISTEMA DE CÁLCULO: Amortización Francesa (Cuota Fija)
// Fórmula: Cuota = [Monto * (TEM x (1 + TEM)^n)] / [(1 + TEM)^n - 1]
export const calculateLoanPayment = (amount, monthlyInterestRate, totalWeeks) => {
  // Convertir semanas a meses para el cálculo
  const totalMonths = Math.ceil(totalWeeks / 4);
  
  // Tasa de interés mensual en decimal
  const TEM = monthlyInterestRate / 100;
  
  // Si la tasa es 0, dividir el monto entre los meses
  if (TEM === 0) {
    const monthlyPayment = amount / totalMonths;
    const weeklyPayment = monthlyPayment / 4;
    
    return {
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      weeklyPayment: Math.ceil(weeklyPayment),
      totalInterest: 0,
      totalAmount: amount,
      totalMonths: totalMonths
    };
  }
  
  // Aplicar fórmula de amortización francesa
  const potencia = Math.pow(1 + TEM, totalMonths);
  const monthlyPayment = amount * (TEM * potencia) / (potencia - 1);
  
  // Calcular el pago semanal (dividir el pago mensual entre 4 semanas)
  const weeklyPayment = monthlyPayment / 4;
  
  // Calcular el total a pagar y los intereses
  const totalAmount = monthlyPayment * totalMonths;
  const totalInterest = totalAmount - amount;
  
  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    weeklyPayment: Math.ceil(weeklyPayment),
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalMonths: totalMonths,
    weeklyCapital: Math.round((amount / totalWeeks) * 100) / 100
  };
};

// Función auxiliar para calcular el cronograma de pagos detallado
export const calculateAmortizationSchedule = (amount, monthlyInterestRate, totalMonths) => {
  const TEM = monthlyInterestRate / 100;
  const schedule = [];
  let remainingBalance = amount;
  
  // Si la tasa es 0, dividir el capital equitativamente
  if (TEM === 0) {
    const monthlyCapital = amount / totalMonths;
    for (let i = 1; i <= totalMonths; i++) {
      schedule.push({
        month: i,
        payment: monthlyCapital,
        interest: 0,
        capital: monthlyCapital,
        balance: Math.round((remainingBalance - monthlyCapital) * 100) / 100
      });
      remainingBalance -= monthlyCapital;
    }
    return schedule;
  }
  
  // Calcular cuota fija con fórmula francesa
  const potencia = Math.pow(1 + TEM, totalMonths);
  const monthlyPayment = amount * (TEM * potencia) / (potencia - 1);
  
  for (let i = 1; i <= totalMonths; i++) {
    const interest = remainingBalance * TEM;
    const capital = monthlyPayment - interest;
    remainingBalance -= capital;
    
    schedule.push({
      month: i,
      payment: Math.round(monthlyPayment * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      capital: Math.round(capital * 100) / 100,
      balance: Math.round(Math.max(0, remainingBalance) * 100) / 100
    });
  }
  
  return schedule;
};

// Préstamos activos - Inicializar vacío
export const initialLoans = [];

// Solicitudes de préstamo - Inicializar vacío
export const initialLoanRequests = [];

export const generateMockPaymentSchedule = (loanAmount, totalWeeks, monthlyInterestRate, startDate) => {
  console.log('📋 generateMockPaymentSchedule - Iniciando:', {
    loanAmount,
    totalWeeks,
    monthlyInterestRate,
    startDate
  });
  
  const calculation = calculateLoanPayment(loanAmount, monthlyInterestRate, totalWeeks);
  const schedule = [];
  let remainingBalance = loanAmount;
  
  // Para la primera semana, usar la fecha requerida como base
  // Manejar correctamente la fecha para evitar problemas de zona horaria
  let currentDate;
  if (typeof startDate === 'string' && startDate.includes('-')) {
    const [year, month, day] = startDate.split('T')[0].split('-').map(Number);
    currentDate = new Date(year, month - 1, day, 12, 0, 0);
  } else {
    currentDate = new Date(startDate);
  }
  
  console.log('📅 generateMockPaymentSchedule - Fecha de inicio:', {
    originalStartDate: startDate,
    parsedCurrentDate: currentDate.toISOString().split('T')[0],
    dayOfWeek: currentDate.getDay(),
    dayName: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][currentDate.getDay()]
  });
  
  for (let i = 1; i <= totalWeeks; i++) {
    let wednesdayDate;
    
    if (i === 1) {
      // Para la primera semana, encontrar el próximo miércoles desde la fecha de inicio
      console.log(`🔄 Semana ${i} - Calculando primer miércoles desde:`, currentDate.toISOString().split('T')[0]);
      wednesdayDate = getNextWednesday(currentDate);
    } else {
      // Para las semanas siguientes, simplemente sumar 7 días (siguiente miércoles)
      currentDate.setDate(currentDate.getDate() + 7);
      wednesdayDate = new Date(currentDate);
      console.log(`🔄 Semana ${i} - Agregando 7 días:`, wednesdayDate.toISOString().split('T')[0]);
    }
    
    remainingBalance -= calculation.weeklyCapital;
    
    const payment = {
      week: i,
      dueDate: wednesdayDate.toISOString().split('T')[0],
      weeklyPayment: calculation.weeklyPayment,
      capitalPayment: calculation.weeklyCapital,
      interestPayment: (calculation.weeklyPayment - calculation.weeklyCapital),
      remainingBalance: Math.max(0, Math.round(remainingBalance * 100) / 100),
      status: 'pending'
    };
    
    schedule.push(payment);
    
    if (i <= 3) {
      console.log(`✅ Semana ${i} programada:`, {
        dueDate: payment.dueDate,
        amount: payment.weeklyPayment,
        dayOfWeek: wednesdayDate.getDay()
      });
    }
    
    currentDate = new Date(wednesdayDate);
  }
  
  console.log('🎯 generateMockPaymentSchedule - Cronograma completo (primeras 3 semanas):', 
    schedule.slice(0, 3).map(p => ({ week: p.week, dueDate: p.dueDate, amount: p.weeklyPayment }))
  );
  
  return schedule;
};