export const initialUsers = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: 'Administrador' },
  { id: 2, username: 'arteaga', password: 'arteaga123', role: 'member', name: 'Arteaga', memberId: 1 },
  { id: 3, username: 'rossi', password: 'rossi123', role: 'member', name: 'Rossi', memberId: 2 },
  { id: 4, username: 'yangali', password: 'yangali123', role: 'member', name: 'Yangali', memberId: 3 },
  { id: 5, username: 'daniel', password: 'daniel123', role: 'member', name: 'Daniel', memberId: 4 },
  { id: 6, username: 'leandro', password: 'leandro123', role: 'member', name: 'Leandro', memberId: 5 },
  { id: 7, username: 'externo1', password: 'ext123', role: 'external', name: 'Cliente Externo 1' }
];

export const initialMembersData = [
  { id: 1, name: 'Arteaga', dni: '12345678', shares: 20, guarantee: 10000, creditRating: 'green', creditScore: 78, phone: '987654321', email: 'arteaga@email.com' },
  { id: 2, name: 'Rossi', dni: '23456789', shares: 18, guarantee: 9000, creditRating: 'green', creditScore: 82, phone: '987654322', email: 'rossi@email.com' },
  { id: 3, name: 'Yangali', dni: '34567890', shares: 22, guarantee: 11000, creditRating: 'yellow', creditScore: 45, phone: '987654323', email: 'yangali@email.com' },
  { id: 4, name: 'Daniel', dni: '45678901', shares: 15, guarantee: 7500, creditRating: 'green', creditScore: 67, phone: '987654324', email: 'daniel@email.com' },
  { id: 5, name: 'Leandro', dni: '56789012', shares: 25, guarantee: 12500, creditRating: 'red', creditScore: 22, phone: '987654325', email: 'leandro@email.com' },
  { id: 6, name: 'Joel', dni: '67890123', shares: 16, guarantee: 8000, creditRating: 'green', creditScore: 71, phone: '987654326', email: 'joel@email.com' },
  { id: 7, name: 'Lescano', dni: '78901234', shares: 19, guarantee: 9500, creditRating: 'yellow', creditScore: 52, phone: '987654327', email: 'lescano@email.com' },
  { id: 8, name: 'Julia', dni: '89012345', shares: 21, guarantee: 10500, creditRating: 'green', creditScore: 85, phone: '987654328', email: 'julia@email.com' },
  { id: 9, name: 'Club Juventud', dni: '90123456', shares: 30, guarantee: 15000, creditRating: 'green', creditScore: 89, phone: '987654329', email: 'club@email.com' },
  { id: 10, name: 'Ito', dni: '01234567', shares: 17, guarantee: 8500, creditRating: 'yellow', creditScore: 38, phone: '987654330', email: 'ito@email.com' },
  { id: 11, name: 'Alexander', dni: '11223344', shares: 23, guarantee: 11500, creditRating: 'green', creditScore: 76, phone: '987654331', email: 'alexander@email.com' },
  { id: 12, name: 'Yovana', dni: '22334455', shares: 14, guarantee: 7000, creditRating: 'red', creditScore: 18, phone: '987654332', email: 'yovana@email.com' },
  { id: 13, name: 'Cope', dni: '33445566', shares: 20, guarantee: 10000, creditRating: 'green', creditScore: 73, phone: '987654333', email: 'cope@email.com' },
  { id: 14, name: 'Torres', dni: '44556677', shares: 18, guarantee: 9000, creditRating: 'yellow', creditScore: 41, phone: '987654334', email: 'torres@email.com' },
  { id: 15, name: 'Rusbel', dni: '55667788', shares: 26, guarantee: 13000, creditRating: 'green', creditScore: 87, phone: '987654335', email: 'rusbel@email.com' },
  { id: 16, name: 'Palacios', dni: '66778899', shares: 15, guarantee: 7500, creditRating: 'green', creditScore: 64, phone: '987654336', email: 'palacios@email.com' },
  { id: 17, name: 'T.Lujan', dni: '77889900', shares: 19, guarantee: 9500, creditRating: 'yellow', creditScore: 49, phone: '987654337', email: 'tlujan@email.com' },
  { id: 18, name: 'Godofredo', dni: '88990011', shares: 22, guarantee: 11000, creditRating: 'green', creditScore: 79, phone: '987654338', email: 'godofredo@email.com' },
  { id: 19, name: 'Joel Diana', dni: '99001122', shares: 16, guarantee: 8000, creditRating: 'red', creditScore: 25, phone: '987654339', email: 'joeldiana@email.com' },
  { id: 20, name: 'Chambi', dni: '10203040', shares: 24, guarantee: 12000, creditRating: 'green', creditScore: 83, phone: '987654340', email: 'chambi@email.com' },
  { id: 21, name: 'Gastón', dni: '20304050', shares: 18, guarantee: 9000, creditRating: 'yellow', creditScore: 56, phone: '987654341', email: 'gaston@email.com' },
  { id: 22, name: 'M.Sanchez', dni: '30405060', shares: 20, guarantee: 10000, creditRating: 'green', creditScore: 69, phone: '987654342', email: 'msanchez@email.com' },
  { id: 23, name: 'Miguel', dni: '40506070', shares: 17, guarantee: 8500, creditRating: 'green', creditScore: 72, phone: '987654343', email: 'miguel@email.com' },
  { id: 24, name: 'Evanovich', dni: '50607080', shares: 21, guarantee: 10500, creditRating: 'yellow', creditScore: 44, phone: '987654344', email: 'evanovich@email.com' },
  { id: 25, name: 'Gabino', dni: '60708090', shares: 15, guarantee: 7500, creditRating: 'red', creditScore: 15, phone: '987654345', email: 'gabino@email.com' },
  { id: 26, name: 'Pepe', dni: '70809001', shares: 19, guarantee: 9500, creditRating: 'green', creditScore: 68, phone: '987654346', email: 'pepe@email.com' },
  { id: 27, name: 'Tito', dni: '80900112', shares: 23, guarantee: 11500, creditRating: 'green', creditScore: 81, phone: '987654347', email: 'tito@email.com' },
  { id: 28, name: 'Guando', dni: '90011223', shares: 16, guarantee: 8000, creditRating: 'yellow', creditScore: 33, phone: '987654348', email: 'guando@email.com' },
  { id: 29, name: 'Victor', dni: '11223300', shares: 25, guarantee: 12500, creditRating: 'green', creditScore: 86, phone: '987654349', email: 'victor@email.com' },
  { id: 30, name: 'Jack', dni: '22334411', shares: 14, guarantee: 7000, creditRating: 'red', creditScore: 12, phone: '987654350', email: 'jack@email.com' },
  { id: 31, name: 'Charapa', dni: '33445522', shares: 22, guarantee: 11000, creditRating: 'green', creditScore: 74, phone: '987654351', email: 'charapa@email.com' },
  { id: 32, name: 'J.C', dni: '44556633', shares: 18, guarantee: 9000, creditRating: 'yellow', creditScore: 47, phone: '987654352', email: 'jc@email.com' },
  { id: 33, name: 'Pochin', dni: '55667744', shares: 20, guarantee: 10000, creditRating: 'green', creditScore: 77, phone: '987654353', email: 'pochin@email.com' },
  { id: 34, name: 'Zapata', dni: '66778855', shares: 17, guarantee: 8500, creditRating: 'green', creditScore: 66, phone: '987654354', email: 'zapata@email.com' },
  { id: 35, name: 'Dani', dni: '77889966', shares: 24, guarantee: 12000, creditRating: 'yellow', creditScore: 58, phone: '987654355', email: 'dani@email.com' },
  { id: 36, name: 'Abel', dni: '88990077', shares: 16, guarantee: 8000, creditRating: 'red', creditScore: 8, phone: '987654356', email: 'abel@email.com' },
  { id: 37, name: 'Hiromi', dni: '99001188', shares: 21, guarantee: 10500, creditRating: 'green', creditScore: 75, phone: '987654357', email: 'hiromi@email.com' },
  { id: 38, name: 'Alex', dni: '10111299', shares: 19, guarantee: 9500, creditRating: 'green', creditScore: 70, phone: '987654358', email: 'alex@email.com' },
  { id: 39, name: 'Oldary', dni: '21223300', shares: 15, guarantee: 7500, creditRating: 'yellow', creditScore: 42, phone: '987654359', email: 'oldary@email.com' },
  { id: 40, name: 'Diana', dni: '32334411', shares: 23, guarantee: 11500, creditRating: 'green', creditScore: 84, phone: '987654360', email: 'diana@email.com' }
];

// Función para determinar la calificación crediticia basada en el puntaje
export const getCreditRatingFromScore = (creditScore) => {
  if (creditScore >= 61 && creditScore <= 90) return 'green';
  if (creditScore >= 31 && creditScore <= 60) return 'yellow';
  if (creditScore >= 1 && creditScore <= 30) return 'red';
  return 'red'; // Por defecto
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
  
  const dayOfWeek = d.getDay();
  let daysToAdd;
  
  // Lógica corregida: ir al próximo miércoles más cercano
  if (dayOfWeek === 3) {
    // Si ya es miércoles, ir al próximo miércoles (7 días)
    daysToAdd = 7;
  } else if (dayOfWeek < 3) {
    // Domingo (0), Lunes (1), Martes (2): ir al miércoles de esta semana
    daysToAdd = 3 - dayOfWeek;
  } else {
    // Jueves (4), Viernes (5), Sábado (6): ir al miércoles de la próxima semana
    daysToAdd = (7 - dayOfWeek) + 3;
  }
  
  d.setDate(d.getDate() + daysToAdd);
  return d;
};

// Función para generar fechas de miércoles para pagos semanales
const generateWednesdayPaymentDates = (startDate, weeks) => {
  const dates = [];
  let currentDate = new Date(startDate);
  
  for (let i = 0; i < weeks; i++) {
    // Agregar una semana (7 días)
    currentDate.setDate(currentDate.getDate() + 7);
    // Encontrar el miércoles más cercano
    const wednesdayDate = getNextWednesday(currentDate);
    dates.push(wednesdayDate.toISOString().split('T')[0]);
    currentDate = new Date(wednesdayDate);
  }
  
  return dates;
};

export const initialLoans = [
  {
    id: 1,
    memberId: 1,
    memberName: 'Arteaga',
    originalAmount: 5000,
    remainingAmount: 3125,
    installments: 96, // 24 meses = 96 semanas
    currentInstallment: 36, // 9 meses = 36 semanas
    interestRate: 3,
    weeklyPayment: 54.69, // (5000 + 150) / 96
    dueDate: '2025-05-28', // Miércoles
    status: 'current',
    startDate: '2024-08-28', // Miércoles
    paymentHistory: [
      { date: '2024-09-04', amount: 54.69, type: 'weekly' },
      { date: '2024-09-11', amount: 54.69, type: 'weekly' },
      { date: '2024-09-18', amount: 54.69, type: 'weekly' },
      { date: '2024-09-25', amount: 54.69, type: 'weekly' },
      { date: '2024-10-02', amount: 54.69, type: 'weekly' },
      { date: '2024-10-09', amount: 54.69, type: 'weekly' },
      { date: '2024-10-16', amount: 54.69, type: 'weekly' },
      { date: '2024-10-23', amount: 54.69, type: 'weekly' }
    ]
  },
  {
    id: 2,
    memberId: 3,
    memberName: 'Yangali',
    originalAmount: 3000,
    remainingAmount: 2250,
    installments: 48, // 12 meses = 48 semanas
    currentInstallment: 16, // 4 meses = 16 semanas
    interestRate: 5,
    weeklyPayment: 65.63, // (3000 + 150) / 48
    dueDate: '2025-05-14', // Miércoles
    status: 'overdue',
    startDate: '2025-01-15', // Miércoles
    paymentHistory: [
      { date: '2025-01-22', amount: 65.63, type: 'weekly' },
      { date: '2025-01-29', amount: 65.63, type: 'weekly' },
      { date: '2025-02-05', amount: 65.63, type: 'weekly' },
      { date: '2025-02-12', amount: 65.63, type: 'weekly' }
    ]
  },
  {
    id: 3,
    memberId: 5,
    memberName: 'Leandro',
    originalAmount: 1500,
    remainingAmount: 750,
    installments: 32, // 8 meses = 32 semanas
    currentInstallment: 20, // 5 meses = 20 semanas
    interestRate: 10,
    weeklyPayment: 51.56, // (1500 + 150) / 32
    dueDate: '2025-04-16', // Miércoles
    status: 'overdue',
    startDate: '2024-12-18', // Miércoles
    paymentHistory: [
      { date: '2024-12-25', amount: 51.56, type: 'weekly' },
      { date: '2025-01-01', amount: 51.56, type: 'weekly' },
      { date: '2025-01-08', amount: 51.56, type: 'weekly' },
      { date: '2025-01-15', amount: 51.56, type: 'weekly' }
    ]
  }
];

export const initialLoanRequests = [
  {
    id: 1,
    memberId: 4,
    memberName: 'Daniel',
    amount: 2500,
    installments: 48, // 12 meses = 48 semanas
    purpose: 'Capital de trabajo para negocio',
    requestDate: '2025-05-14',
    requiredDate: '2025-05-30',
    status: 'pending',
    interestRate: 5,
    monthlyIncome: 3500,
    otherDebts: 800,
    guaranteeOffered: 7500,
    comments: 'Solicita préstamo para ampliar su negocio de venta de repuestos',
    documents: ['dni', 'income_proof', 'business_license']
  },
  {
    id: 2,
    memberId: 7,
    memberName: 'Lescano',
    amount: 4000,
    installments: 72, // 18 meses = 72 semanas
    purpose: 'Mejoras en vivienda',
    requestDate: '2025-05-21',
    requiredDate: '2025-06-15',
    status: 'approved',
    interestRate: 3,
    monthlyIncome: 4200,
    otherDebts: 1200,
    guaranteeOffered: 9500,
    comments: 'Aprobado por buen historial crediticio y garantía suficiente',
    documents: ['dni', 'income_proof', 'property_deed'],
    approvedDate: '2025-05-21',
    approvedBy: 'admin',
    weeklyPayment: 62.69 // (4000 + 120) / 72
  }
];

export const generateMockPaymentSchedule = (loanAmount, installments, interestRate, startDate) => {
  // Interés fijo sobre el monto original
  const totalInterest = loanAmount * (interestRate / 100);
  const totalAmount = loanAmount + totalInterest;
  const weeklyPayment = totalAmount / installments;
  
  // Pago semanal fijo de capital (sin intereses en cada cuota)
  const weeklyPrincipal = loanAmount / installments;
  // El interés se distribuye equitativamente entre todas las cuotas
  const weeklyInterest = totalInterest / installments;
  
  const schedule = [];
  let remainingBalance = loanAmount;
  let currentDate = new Date(startDate);
  
  for (let i = 1; i <= installments; i++) {
    // Agregar una semana (7 días) y encontrar el miércoles más cercano
    currentDate.setDate(currentDate.getDate() + 7);
    const wednesdayDate = getNextWednesday(currentDate);
    
    remainingBalance -= weeklyPrincipal;
    
    schedule.push({
      installment: i,
      dueDate: wednesdayDate.toISOString().split('T')[0],
      weeklyPayment: Math.round(weeklyPayment * 100) / 100,
      principalPayment: Math.round(weeklyPrincipal * 100) / 100,
      interestPayment: Math.round(weeklyInterest * 100) / 100,
      remainingBalance: Math.max(0, Math.round(remainingBalance * 100) / 100),
      status: 'pending'
    });
    
    currentDate = new Date(wednesdayDate);
  }
  
  return schedule;
};