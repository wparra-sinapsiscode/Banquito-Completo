// Test para verificar la lógica corregida de getNextWednesday

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
  
  // Calcular días hasta el próximo miércoles
  if (dayOfWeek < 3) {
    // Domingo (0), Lunes (1), Martes (2): calcular días hasta el miércoles
    daysToAdd = 3 - dayOfWeek;
  } else if (dayOfWeek === 3) {
    // Si es miércoles, ir al siguiente miércoles (7 días)
    daysToAdd = 7;
  } else {
    // Jueves (4), Viernes (5), Sábado (6): calcular días hasta el próximo miércoles
    daysToAdd = 10 - dayOfWeek;
  }
  
  d.setDate(d.getDate() + daysToAdd);
  
  return d;
};

console.log('=== TEST DE PRÓXIMO MIÉRCOLES ===\n');

// Test con el 18 de junio de 2024 (martes)
const june18 = '2024-06-18';
const june18Date = new Date(2024, 5, 18, 12, 0, 0); // mes 5 = junio (0-indexado)
console.log('Fecha de prueba:', june18);
console.log('Día de la semana:', ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][june18Date.getDay()]);

const nextWedJune = getNextWednesday(june18);
console.log('Siguiente miércoles:', nextWedJune.toLocaleDateString('es-ES'));
console.log('Debería ser: 19 de junio de 2024 (miércoles)\n');

// Test con diferentes días de diciembre 2024
console.log('=== PRUEBAS ADICIONALES ===');
const testCases = [
  { date: '2024-12-09', expected: '11/12/2024' }, // Lunes -> Miércoles misma semana
  { date: '2024-12-10', expected: '11/12/2024' }, // Martes -> Miércoles misma semana
  { date: '2024-12-11', expected: '18/12/2024' }, // Miércoles -> Siguiente miércoles
  { date: '2024-12-12', expected: '18/12/2024' }, // Jueves -> Miércoles próxima semana
  { date: '2024-12-13', expected: '18/12/2024' }, // Viernes -> Miércoles próxima semana
  { date: '2024-12-14', expected: '18/12/2024' }, // Sábado -> Miércoles próxima semana
  { date: '2024-12-15', expected: '18/12/2024' }  // Domingo -> Miércoles próxima semana
];

testCases.forEach(({ date, expected }) => {
  const testDate = new Date(date + 'T12:00:00');
  const result = getNextWednesday(date);
  const resultStr = result.toLocaleDateString('es-ES');
  const dayName = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][testDate.getDay()];
  const correct = resultStr === expected ? '✅' : '❌';
  
  console.log(`${correct} ${date} (${dayName}) -> ${resultStr} (esperado: ${expected})`);
});