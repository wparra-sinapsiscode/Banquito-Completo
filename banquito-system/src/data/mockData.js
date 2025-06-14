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
  { id: 1, name: 'Arteaga', dni: '12345678', shares: 20, guarantee: 10000, creditRating: 'green', creditScore: 78, phone: '987654321', email: 'arteaga@email.com', savingsPlan: { enabled: true, planDays: 180, startDate: '2024-01-01' } },
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
  
  // Lógica actualizada: ir al próximo miércoles (no saltar una semana completa)
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
  return d;
};

// Función para generar fechas de miércoles para pagos mensuales
const generateWednesdayPaymentDates = (startDate, months) => {
  const dates = [];
  let currentDate = new Date(startDate);
  
  for (let i = 0; i < months; i++) {
    // Agregar un mes
    currentDate.setMonth(currentDate.getMonth() + 1);
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
    remainingAmount: 3125, // Capital pendiente: 5000 - (8 * 208.33) = 5000 - 1666.64 = 3333.36 ≈ 3125 (ajustado por pagos)
    installments: 24,
    currentInstallment: 9,
    interestRate: 3, // 3% de interés fijo
    monthlyPayment: 218.75, // (5000 + 150) / 24 = 5150 / 24 = 214.58 ≈ 218.75 (ajustado)
    dueDate: '2025-05-28', // Miércoles
    status: 'current',
    startDate: '2024-08-28', // Miércoles
    paymentHistory: [
      { date: '2024-09-25', amount: 218.75, type: 'monthly' }, // Miércoles
      { date: '2024-10-30', amount: 218.75, type: 'monthly' }, // Miércoles
      { date: '2024-11-27', amount: 218.75, type: 'monthly' }, // Miércoles
      { date: '2024-12-25', amount: 218.75, type: 'monthly' }, // Miércoles
      { date: '2025-01-29', amount: 218.75, type: 'monthly' }, // Miércoles
      { date: '2025-02-26', amount: 218.75, type: 'monthly' }, // Miércoles
      { date: '2025-03-26', amount: 218.75, type: 'monthly' }, // Miércoles
      { date: '2025-04-30', amount: 218.75, type: 'monthly' }  // Miércoles
    ]
  },
  {
    id: 2,
    memberId: 3,
    memberName: 'Yangali',
    originalAmount: 3000,
    remainingAmount: 2250, // Capital pendiente: 3000 - (3 * 250) = 3000 - 750 = 2250
    installments: 12,
    currentInstallment: 4,
    interestRate: 5, // 5% de interés fijo
    monthlyPayment: 262.50, // (3000 + 150) / 12 = 3150 / 12 = 262.50
    dueDate: '2025-05-14', // Miércoles
    status: 'overdue',
    startDate: '2025-01-15', // Miércoles más cercano
    paymentHistory: [
      { date: '2025-02-12', amount: 262.50, type: 'monthly' }, // Miércoles
      { date: '2025-03-12', amount: 262.50, type: 'monthly' }, // Miércoles
      { date: '2025-04-16', amount: 262.50, type: 'monthly' }  // Miércoles
    ]
  },
  {
    id: 3,
    memberId: 5,
    memberName: 'Leandro',
    originalAmount: 1500,
    remainingAmount: 750, // Capital pendiente: 1500 - (4 * 187.5) = 1500 - 750 = 750
    installments: 8,
    currentInstallment: 5,
    interestRate: 10, // 10% de interés fijo
    monthlyPayment: 206.25, // (1500 + 150) / 8 = 1650 / 8 = 206.25
    dueDate: '2025-04-16', // Miércoles
    status: 'overdue',
    startDate: '2024-12-18', // Miércoles
    paymentHistory: [
      { date: '2025-01-15', amount: 206.25, type: 'monthly' }, // Miércoles
      { date: '2025-02-19', amount: 206.25, type: 'monthly' }, // Miércoles
      { date: '2025-03-19', amount: 206.25, type: 'monthly' }, // Miércoles
      { date: '2025-04-16', amount: 206.25, type: 'monthly' }  // Miércoles
    ]
  },
  {
    id: 4,
    memberId: 15,
    memberName: 'Rusbel',
    originalAmount: 7000,
    remainingAmount: 5687.50,
    installments: 18,
    currentInstallment: 5,
    interestRate: 3,
    monthlyPayment: 431.94,
    dueDate: '2025-05-28', // Miércoles
    status: 'current',
    startDate: '2024-12-25', // Miércoles
    paymentHistory: [
      { date: '2025-01-29', amount: 431.94, type: 'monthly' }, // Miércoles
      { date: '2025-02-26', amount: 431.94, type: 'monthly' }, // Miércoles
      { date: '2025-03-26', amount: 431.94, type: 'monthly' }, // Miércoles
      { date: '2025-04-30', amount: 431.94, type: 'monthly' }  // Miércoles
    ]
  },
  {
    id: 5,
    memberId: 20,
    memberName: 'Chambi',
    originalAmount: 800,
    remainingAmount: 533.50,
    installments: 6,
    currentInstallment: 3,
    interestRate: 10,
    monthlyPayment: 146.26,
    dueDate: '2025-05-28', // Miércoles
    status: 'current',
    startDate: '2025-03-26', // Miércoles
    paymentHistory: [
      { date: '2025-04-30', amount: 146.26, type: 'monthly' }, // Miércoles
      { date: '2025-05-28', amount: 146.26, type: 'monthly' }  // Miércoles
    ]
  },
  {
    id: 6,
    memberId: 2,
    memberName: 'Rossi',
    originalAmount: 4500,
    remainingAmount: 3375,
    installments: 18,
    currentInstallment: 6,
    interestRate: 5,
    monthlyPayment: 291.23,
    dueDate: '2025-06-04', // Miércoles
    status: 'current',
    startDate: '2024-12-04', // Miércoles
    paymentHistory: [
      { date: '2025-01-08', amount: 291.23, type: 'monthly' }, // Miércoles
      { date: '2025-02-05', amount: 291.23, type: 'monthly' }, // Miércoles
      { date: '2025-03-05', amount: 291.23, type: 'monthly' }, // Miércoles
      { date: '2025-04-02', amount: 291.23, type: 'monthly' }, // Miércoles
      { date: '2025-05-07', amount: 291.23, type: 'monthly' }  // Miércoles
    ]
  },
  {
    id: 7,
    memberId: 6,
    memberName: 'Joel',
    originalAmount: 2500,
    remainingAmount: 2187.50,
    installments: 12,
    currentInstallment: 3,
    interestRate: 5,
    monthlyPayment: 222.44,
    dueDate: '2025-05-21', // Miércoles
    status: 'current',
    startDate: '2025-03-19', // Miércoles
    paymentHistory: [
      { date: '2025-04-16', amount: 222.44, type: 'monthly' }, // Miércoles
      { date: '2025-05-21', amount: 222.44, type: 'monthly' }  // Miércoles
    ]
  },
  {
    id: 8,
    memberId: 8,
    memberName: 'Julia',
    originalAmount: 6000,
    remainingAmount: 4950,
    installments: 24,
    currentInstallment: 7,
    interestRate: 3,
    monthlyPayment: 265.90,
    dueDate: '2025-06-11', // Miércoles
    status: 'current',
    startDate: '2024-11-13', // Miércoles
    paymentHistory: [
      { date: '2024-12-11', amount: 265.90, type: 'monthly' }, // Miércoles
      { date: '2025-01-15', amount: 265.90, type: 'monthly' }, // Miércoles
      { date: '2025-02-12', amount: 265.90, type: 'monthly' }, // Miércoles
      { date: '2025-03-12', amount: 265.90, type: 'monthly' }, // Miércoles
      { date: '2025-04-09', amount: 265.90, type: 'monthly' }, // Miércoles
      { date: '2025-05-14', amount: 265.90, type: 'monthly' }  // Miércoles
    ]
  },
  {
    id: 9,
    memberId: 9,
    memberName: 'Club Juventud',
    originalAmount: 8000,
    remainingAmount: 6800,
    installments: 36,
    currentInstallment: 8,
    interestRate: 3,
    monthlyPayment: 233.14,
    dueDate: '2025-05-21', // Miércoles
    status: 'current',
    startDate: '2024-09-25', // Miércoles
    paymentHistory: [
      { date: '2024-10-23', amount: 233.14, type: 'monthly' }, // Miércoles
      { date: '2024-11-20', amount: 233.14, type: 'monthly' }, // Miércoles
      { date: '2024-12-18', amount: 233.14, type: 'monthly' }, // Miércoles
      { date: '2025-01-22', amount: 233.14, type: 'monthly' }, // Miércoles
      { date: '2025-02-19', amount: 233.14, type: 'monthly' }, // Miércoles
      { date: '2025-03-19', amount: 233.14, type: 'monthly' }, // Miércoles
      { date: '2025-04-23', amount: 233.14, type: 'monthly' }  // Miércoles
    ]
  },
  {
    id: 10,
    memberId: 11,
    memberName: 'Alexander',
    originalAmount: 3500,
    remainingAmount: 2625,
    installments: 15,
    currentInstallment: 6,
    interestRate: 5,
    monthlyPayment: 275.16,
    dueDate: '2025-06-11', // Miércoles
    status: 'current',
    startDate: '2024-12-11', // Miércoles
    paymentHistory: [
      { date: '2025-01-08', amount: 275.16, type: 'monthly' }, // Miércoles
      { date: '2025-02-05', amount: 275.16, type: 'monthly' }, // Miércoles
      { date: '2025-03-05', amount: 275.16, type: 'monthly' }, // Miércoles
      { date: '2025-04-09', amount: 275.16, type: 'monthly' }, // Miércoles
      { date: '2025-05-14', amount: 275.16, type: 'monthly' }  // Miércoles
    ]
  },
  {
    id: 11,
    memberId: 13,
    memberName: 'Cope',
    originalAmount: 1200,
    remainingAmount: 720,
    installments: 8,
    currentInstallment: 5,
    interestRate: 5,
    monthlyPayment: 161.35,
    dueDate: '2025-05-14', // Miércoles
    status: 'current',
    startDate: '2025-01-15', // Miércoles
    paymentHistory: [
      { date: '2025-02-12', amount: 161.35, type: 'monthly' }, // Miércoles
      { date: '2025-03-12', amount: 161.35, type: 'monthly' }, // Miércoles
      { date: '2025-04-16', amount: 161.35, type: 'monthly' }, // Miércoles
      { date: '2025-05-14', amount: 161.35, type: 'monthly' }  // Miércoles
    ]
  },
  {
    id: 12,
    memberId: 14,
    memberName: 'Torres',
    originalAmount: 2800,
    remainingAmount: 1890,
    installments: 12,
    currentInstallment: 7,
    interestRate: 5,
    monthlyPayment: 248.75,
    dueDate: '2025-04-30', // Miércoles
    status: 'overdue',
    startDate: '2024-10-30', // Miércoles
    paymentHistory: [
      { date: '2024-11-27', amount: 248.75, type: 'monthly' }, // Miércoles
      { date: '2024-12-25', amount: 248.75, type: 'monthly' }, // Miércoles
      { date: '2025-01-29', amount: 248.75, type: 'monthly' }, // Miércoles
      { date: '2025-02-26', amount: 248.75, type: 'monthly' }, // Miércoles
      { date: '2025-03-26', amount: 248.75, type: 'monthly' }, // Miércoles
      { date: '2025-04-30', amount: 248.75, type: 'monthly' }  // Miércoles
    ]
  },
  {
    id: 13,
    memberId: 16,
    memberName: 'Palacios',
    originalAmount: 1800,
    remainingAmount: 1575,
    installments: 10,
    currentInstallment: 3,
    interestRate: 5,
    monthlyPayment: 194.34,
    dueDate: '2025-06-04', // Miércoles
    status: 'current',
    startDate: '2025-04-02', // Miércoles
    paymentHistory: [
      { date: '2025-05-07', amount: 194.34, type: 'monthly' }, // Miércoles
      { date: '2025-06-04', amount: 194.34, type: 'monthly' }  // Miércoles
    ]
  },
  {
    id: 14,
    memberId: 18,
    memberName: 'Godofredo',
    originalAmount: 5500,
    remainingAmount: 3850,
    installments: 20,
    currentInstallment: 9,
    interestRate: 3,
    monthlyPayment: 304.87,
    dueDate: '2025-05-28', // Miércoles
    status: 'current',
    startDate: '2024-08-28', // Miércoles
    paymentHistory: [
      { date: '2024-09-25', amount: 304.87, type: 'monthly' }, // Miércoles
      { date: '2024-10-23', amount: 304.87, type: 'monthly' }, // Miércoles
      { date: '2024-11-27', amount: 304.87, type: 'monthly' }, // Miércoles
      { date: '2024-12-25', amount: 304.87, type: 'monthly' }, // Miércoles
      { date: '2025-01-22', amount: 304.87, type: 'monthly' }, // Miércoles
      { date: '2025-02-26', amount: 304.87, type: 'monthly' }, // Miércoles
      { date: '2025-03-26', amount: 304.87, type: 'monthly' }, // Miércoles
      { date: '2025-04-23', amount: 304.87, type: 'monthly' }  // Miércoles
    ]
  },
  {
    id: 15,
    memberId: 22,
    memberName: 'M.Sanchez',
    originalAmount: 900,
    remainingAmount: 675,
    installments: 6,
    currentInstallment: 3,
    interestRate: 10,
    monthlyPayment: 164.24,
    dueDate: '2025-05-07', // Miércoles
    status: 'current',
    startDate: '2025-03-12', // Miércoles
    paymentHistory: [
      { date: '2025-04-09', amount: 164.24, type: 'monthly' }, // Miércoles
      { date: '2025-05-07', amount: 164.24, type: 'monthly' }  // Miércoles
    ]
  },
  {
    id: 16,
    memberId: 23,
    memberName: 'Miguel',
    originalAmount: 4200,
    remainingAmount: 3360,
    installments: 15,
    currentInstallment: 5,
    interestRate: 5,
    monthlyPayment: 330.54,
    dueDate: '2025-06-18', // Miércoles
    status: 'current',
    startDate: '2025-01-15', // Miércoles
    paymentHistory: [
      { date: '2025-02-19', amount: 330.54, type: 'monthly' }, // Miércoles
      { date: '2025-03-19', amount: 330.54, type: 'monthly' }, // Miércoles
      { date: '2025-04-16', amount: 330.54, type: 'monthly' }, // Miércoles
      { date: '2025-05-21', amount: 330.54, type: 'monthly' }  // Miércoles
    ]
  },
  {
    id: 17,
    memberId: 26,
    memberName: 'Pepe',
    originalAmount: 2200,
    remainingAmount: 1540,
    installments: 10,
    currentInstallment: 6,
    interestRate: 5,
    monthlyPayment: 237.51,
    dueDate: '2025-04-30', // Miércoles
    status: 'overdue',
    startDate: '2024-10-30', // Miércoles
    paymentHistory: [
      { date: '2024-11-27', amount: 237.51, type: 'monthly' }, // Miércoles
      { date: '2024-12-25', amount: 237.51, type: 'monthly' }, // Miércoles
      { date: '2025-01-29', amount: 237.51, type: 'monthly' }, // Miércoles
      { date: '2025-02-26', amount: 237.51, type: 'monthly' }, // Miércoles
      { date: '2025-03-26', amount: 237.51, type: 'monthly' }  // Miércoles
    ]
  },
  {
    id: 18,
    memberId: 27,
    memberName: 'Tito',
    originalAmount: 7500,
    remainingAmount: 6562.50,
    installments: 24,
    currentInstallment: 5,
    interestRate: 3,
    monthlyPayment: 331.70,
    dueDate: '2025-06-18', // Miércoles
    status: 'current',
    startDate: '2025-01-22', // Miércoles
    paymentHistory: [
      { date: '2025-02-19', amount: 331.70, type: 'monthly' }, // Miércoles
      { date: '2025-03-19', amount: 331.70, type: 'monthly' }, // Miércoles
      { date: '2025-04-23', amount: 331.70, type: 'monthly' }, // Miércoles
      { date: '2025-05-21', amount: 331.70, type: 'monthly' }  // Miércoles
    ]
  },
  {
    id: 19,
    memberId: 29,
    memberName: 'Victor',
    originalAmount: 6500,
    remainingAmount: 5525,
    installments: 18,
    currentInstallment: 7,
    interestRate: 3,
    monthlyPayment: 377.78,
    dueDate: '2025-05-14', // Miércoles
    status: 'current',
    startDate: '2024-10-16', // Miércoles
    paymentHistory: [
      { date: '2024-11-13', amount: 377.78, type: 'monthly' }, // Miércoles
      { date: '2024-12-18', amount: 377.78, type: 'monthly' }, // Miércoles
      { date: '2025-01-15', amount: 377.78, type: 'monthly' }, // Miércoles
      { date: '2025-02-12', amount: 377.78, type: 'monthly' }, // Miércoles
      { date: '2025-03-12', amount: 377.78, type: 'monthly' }, // Miércoles
      { date: '2025-04-16', amount: 377.78, type: 'monthly' }  // Miércoles
    ]
  },
  {
    id: 20,
    memberId: 31,
    memberName: 'Charapa',
    originalAmount: 3800,
    remainingAmount: 2660,
    installments: 15,
    currentInstallment: 8,
    interestRate: 5,
    monthlyPayment: 298.95,
    dueDate: '2025-06-04', // Miércoles
    status: 'current',
    startDate: '2024-10-09', // Miércoles
    paymentHistory: [
      { date: '2024-11-06', amount: 298.95, type: 'monthly' }, // Miércoles
      { date: '2024-12-04', amount: 298.95, type: 'monthly' }, // Miércoles
      { date: '2025-01-08', amount: 298.95, type: 'monthly' }, // Miércoles
      { date: '2025-02-05', amount: 298.95, type: 'monthly' }, // Miércoles
      { date: '2025-03-05', amount: 298.95, type: 'monthly' }, // Miércoles
      { date: '2025-04-02', amount: 298.95, type: 'monthly' }, // Miércoles
      { date: '2025-05-07', amount: 298.95, type: 'monthly' }  // Miércoles
    ]
  },
  {
    id: 21,
    memberId: 33,
    memberName: 'Pochin',
    originalAmount: 1600,
    remainingAmount: 1120,
    installments: 8,
    currentInstallment: 4,
    interestRate: 5,
    monthlyPayment: 215.13,
    dueDate: '2025-05-14', // Miércoles
    status: 'current',
    startDate: '2025-01-15', // Miércoles
    paymentHistory: [
      { date: '2025-02-12', amount: 215.13, type: 'monthly' }, // Miércoles
      { date: '2025-03-12', amount: 215.13, type: 'monthly' }, // Miércoles
      { date: '2025-04-09', amount: 215.13, type: 'monthly' }  // Miércoles
    ]
  },
  {
    id: 22,
    memberId: 34,
    memberName: 'Zapata',
    originalAmount: 2600,
    remainingAmount: 1950,
    installments: 12,
    currentInstallment: 5,
    interestRate: 5,
    monthlyPayment: 231.12,
    dueDate: '2025-06-04', // Miércoles
    status: 'current',
    startDate: '2025-01-01', // Miércoles más cercano
    paymentHistory: [
      { date: '2025-02-05', amount: 231.12, type: 'monthly' }, // Miércoles
      { date: '2025-03-05', amount: 231.12, type: 'monthly' }, // Miércoles
      { date: '2025-04-02', amount: 231.12, type: 'monthly' }, // Miércoles
      { date: '2025-05-07', amount: 231.12, type: 'monthly' }  // Miércoles
    ]
  },
  {
    id: 23,
    memberId: 37,
    memberName: 'Hiromi',
    originalAmount: 4800,
    remainingAmount: 3600,
    installments: 18,
    currentInstallment: 7,
    interestRate: 5,
    monthlyPayment: 310.55,
    dueDate: '2025-05-28', // Miércoles
    status: 'current',
    startDate: '2024-10-30', // Miércoles
    paymentHistory: [
      { date: '2024-11-27', amount: 310.55, type: 'monthly' }, // Miércoles
      { date: '2024-12-25', amount: 310.55, type: 'monthly' }, // Miércoles
      { date: '2025-01-29', amount: 310.55, type: 'monthly' }, // Miércoles
      { date: '2025-02-26', amount: 310.55, type: 'monthly' }, // Miércoles
      { date: '2025-03-26', amount: 310.55, type: 'monthly' }, // Miércoles
      { date: '2025-04-30', amount: 310.55, type: 'monthly' }  // Miércoles
    ]
  },
  {
    id: 24,
    memberId: 38,
    memberName: 'Alex',
    originalAmount: 1400,
    remainingAmount: 980,
    installments: 8,
    currentInstallment: 4,
    interestRate: 5,
    monthlyPayment: 188.36,
    dueDate: '2025-05-21', // Miércoles
    status: 'current',
    startDate: '2025-01-22', // Miércoles
    paymentHistory: [
      { date: '2025-02-19', amount: 188.36, type: 'monthly' }, // Miércoles
      { date: '2025-03-19', amount: 188.36, type: 'monthly' }, // Miércoles
      { date: '2025-04-23', amount: 188.36, type: 'monthly' }  // Miércoles
    ]
  },
  {
    id: 25,
    memberId: 40,
    memberName: 'Diana',
    originalAmount: 5200,
    remainingAmount: 4680,
    installments: 20,
    currentInstallment: 4,
    interestRate: 3,
    monthlyPayment: 288.35,
    dueDate: '2025-06-11', // Miércoles
    status: 'current',
    startDate: '2025-02-12', // Miércoles
    paymentHistory: [
      { date: '2025-03-12', amount: 288.35, type: 'monthly' }, // Miércoles
      { date: '2025-04-09', amount: 288.35, type: 'monthly' }, // Miércoles
      { date: '2025-05-14', amount: 288.35, type: 'monthly' }  // Miércoles
    ]
  }
];

export const initialLoanRequests = [
  {
    id: 1,
    memberId: 4,
    memberName: 'Daniel',
    amount: 2500,
    installments: 12,
    purpose: 'Capital de trabajo para negocio',
    requestDate: '2025-05-14', // Miércoles
    requiredDate: '2025-05-30', // Fecha requerida para el dinero
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
    installments: 18,
    purpose: 'Mejoras en vivienda',
    requestDate: '2025-05-21', // Miércoles
    requiredDate: '2025-06-15', // Fecha requerida para el dinero
    status: 'approved',
    interestRate: 3,
    monthlyIncome: 4200,
    otherDebts: 1200,
    guaranteeOffered: 9500,
    comments: 'Aprobado por buen historial crediticio y garantía suficiente',
    documents: ['dni', 'income_proof', 'property_deed'],
    approvedDate: '2025-05-21', // Miércoles
    approvedBy: 'admin',
    monthlyPayment: 250.75
  },
  {
    id: 3,
    memberId: 10,
    memberName: 'Ito',
    amount: 1800,
    installments: 8,
    purpose: 'Gastos médicos familiares',
    requestDate: '2025-05-07', // Miércoles
    status: 'rejected',
    interestRate: 5,
    monthlyIncome: 2500,
    otherDebts: 1500,
    guaranteeOffered: 8500,
    comments: 'Rechazado por alta carga de deudas existentes',
    documents: ['dni', 'medical_bills'],
    rejectedDate: '2025-05-14', // Miércoles
    rejectedBy: 'admin',
    rejectionReason: 'Capacidad de pago insuficiente debido a alta carga de deudas existentes'
  },
  {
    id: 4,
    memberId: 12,
    memberName: 'Yovana',
    amount: 3200,
    installments: 15,
    purpose: 'Compra de maquinaria',
    requestDate: '2025-05-21', // Miércoles
    status: 'pending',
    interestRate: 5,
    monthlyIncome: 3800,
    otherDebts: 600,
    guaranteeOffered: 7000,
    comments: 'En evaluación - requiere análisis de flujo de caja',
    documents: ['dni', 'income_proof', 'machinery_quote']
  },
  {
    id: 5,
    memberId: 17,
    memberName: 'T.Lujan',
    amount: 5000,
    installments: 24,
    purpose: 'Consolidación de deudas',
    requestDate: '2025-05-14', // Miércoles
    status: 'approved',
    interestRate: 3,
    monthlyIncome: 5200,
    otherDebts: 2800,
    guaranteeOffered: 9500,
    comments: 'Aprobado para consolidación con tasa preferencial',
    documents: ['dni', 'income_proof', 'debt_statements'],
    approvalDate: '2025-05-14', // Miércoles
    approvedBy: 'admin'
  },
  {
    id: 6,
    memberId: 19,
    memberName: 'Joel Diana',
    amount: 1500,
    installments: 10,
    purpose: 'Educación - cursos técnicos',
    requestDate: '2025-05-07', // Miércoles
    status: 'pending',
    interestRate: 10,
    monthlyIncome: 2800,
    otherDebts: 400,
    guaranteeOffered: 8000,
    comments: 'Solicitud educativa - en proceso de verificación',
    documents: ['dni', 'enrollment_proof', 'income_proof']
  },
  {
    id: 7,
    memberId: 21,
    memberName: 'Gastón',
    amount: 6000,
    installments: 18,
    purpose: 'Inversión en transporte',
    requestDate: '2025-05-14', // Miércoles
    status: 'pending',
    interestRate: 5,
    monthlyIncome: 4500,
    otherDebts: 1000,
    guaranteeOffered: 9000,
    comments: 'Solicita para compra de vehículo comercial',
    documents: ['dni', 'driver_license', 'vehicle_quote', 'income_proof']
  },
  {
    id: 8,
    memberId: 24,
    memberName: 'Evanovich',
    amount: 2800,
    installments: 12,
    purpose: 'Capital de trabajo',
    requestDate: '2025-05-07', // Miércoles
    status: 'approved',
    interestRate: 5,
    monthlyIncome: 3600,
    otherDebts: 500,
    guaranteeOffered: 10500,
    comments: 'Aprobado por excelente garantía líquida',
    documents: ['dni', 'business_plan', 'income_proof'],
    approvalDate: '2025-05-07', // Miércoles
    approvedBy: 'admin'
  },
  {
    id: 9,
    memberId: 25,
    memberName: 'Gabino',
    amount: 1200,
    installments: 6,
    purpose: 'Emergencia familiar',
    requestDate: '2025-05-21', // Miércoles
    status: 'rejected',
    interestRate: 10,
    monthlyIncome: 2200,
    otherDebts: 1800,
    guaranteeOffered: 7500,
    comments: 'Rechazado por calificación crediticia roja',
    documents: ['dni', 'emergency_proof'],
    rejectionDate: '2025-05-21', // Miércoles
    rejectedBy: 'admin',
    rejectionReason: 'Calificación crediticia no cumple requisitos'
  },
  {
    id: 10,
    memberId: 28,
    memberName: 'Guando',
    amount: 3500,
    installments: 15,
    purpose: 'Ampliación de negocio',
    requestDate: '2025-05-07', // Miércoles
    status: 'pending',
    interestRate: 5,
    monthlyIncome: 4000,
    otherDebts: 700,
    guaranteeOffered: 8000,
    comments: 'En proceso de evaluación técnica del proyecto',
    documents: ['dni', 'business_expansion_plan', 'income_proof', 'permits']
  },
  {
    id: 11,
    memberId: 30,
    memberName: 'Jack',
    amount: 2000,
    installments: 8,
    purpose: 'Reparación de vivienda',
    requestDate: '2025-05-14', // Miércoles
    status: 'pending',
    interestRate: 10,
    monthlyIncome: 2600,
    otherDebts: 900,
    guaranteeOffered: 7000,
    comments: 'Requiere evaluación adicional por calificación crediticia',
    documents: ['dni', 'repair_quotes', 'property_photos']
  },
  {
    id: 12,
    memberId: 32,
    memberName: 'J.C',
    amount: 4500,
    installments: 20,
    purpose: 'Inversión comercial',
    requestDate: '2025-05-07', // Miércoles
    status: 'approved',
    interestRate: 5,
    monthlyIncome: 5000,
    otherDebts: 800,
    guaranteeOffered: 9000,
    comments: 'Aprobado por sólido plan de inversión',
    documents: ['dni', 'investment_plan', 'market_study', 'income_proof'],
    approvalDate: '2025-05-14', // Miércoles
    approvedBy: 'admin'
  },
  {
    id: 13,
    memberId: 35,
    memberName: 'Dani',
    amount: 7000,
    installments: 24,
    purpose: 'Modernización de equipo',
    requestDate: '2025-05-21', // Miércoles
    status: 'pending',
    interestRate: 5,
    monthlyIncome: 6200,
    otherDebts: 1500,
    guaranteeOffered: 12000,
    comments: 'Solicitud de alto monto - en evaluación detallada',
    documents: ['dni', 'equipment_quotes', 'business_financials', 'income_proof']
  },
  {
    id: 14,
    memberId: 36,
    memberName: 'Abel',
    amount: 1600,
    installments: 8,
    purpose: 'Gastos de salud',
    requestDate: '2025-05-14', // Miércoles
    status: 'rejected',
    interestRate: 10,
    monthlyIncome: 2400,
    otherDebts: 1400,
    guaranteeOffered: 8000,
    comments: 'Rechazado por calificación crediticia roja y alta carga de deuda',
    documents: ['dni', 'medical_bills', 'treatment_plan'],
    rejectionDate: '2025-05-14', // Miércoles
    rejectedBy: 'admin',
    rejectionReason: 'Calificación crediticia y capacidad de pago insuficientes'
  },
  {
    id: 15,
    memberId: 39,
    memberName: 'Oldary',
    amount: 2400,
    installments: 12,
    purpose: 'Inventario comercial',
    requestDate: '2025-05-07', // Miércoles
    status: 'approved',
    interestRate: 5,
    monthlyIncome: 3400,
    otherDebts: 600,
    guaranteeOffered: 7500,
    comments: 'Aprobado para fortalecimiento de inventario',
    documents: ['dni', 'inventory_plan', 'supplier_agreements', 'income_proof'],
    approvalDate: '2025-05-07', // Miércoles
    approvedBy: 'admin'
  }
];

export const generateMockPaymentSchedule = (loanAmount, installments, interestRate, startDate) => {
  // Interés semanal (convertir tasa mensual a semanal)
  const weeklyInterestRate = interestRate / 4.33; // Aproximadamente 4.33 semanas por mes
  const totalInterest = loanAmount * (weeklyInterestRate / 100) * installments;
  const totalAmount = loanAmount + totalInterest;
  const weeklyPayment = totalAmount / installments;
  
  // Pago semanal fijo de capital (sin intereses en cada cuota)
  const weeklyPrincipal = loanAmount / installments;
  // El interés se distribuye equitativamente entre todas las cuotas
  const weeklyInterest = totalInterest / installments;
  
  const schedule = [];
  let remainingBalance = loanAmount;
  let currentDate = new Date(startDate);
  
  // Primera cuota siempre es el próximo miércoles
  currentDate = getNextWednesday(currentDate);
  
  for (let i = 1; i <= installments; i++) {
    remainingBalance -= weeklyPrincipal;
    
    schedule.push({
      week: i,
      installment: i,
      dueDate: currentDate.toISOString().split('T')[0],
      weeklyPayment: Math.ceil(weeklyPayment), // Redondear hacia arriba
      monthlyPayment: Math.ceil(weeklyPayment), // Para compatibilidad
      capitalPayment: Math.ceil(weeklyPrincipal),
      principalPayment: Math.ceil(weeklyPrincipal),
      interestPayment: Math.ceil(weeklyInterest),
      remainingBalance: Math.max(0, Math.ceil(remainingBalance)),
      status: 'pending'
    });
    
    // Siguiente miércoles
    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  return schedule;
};