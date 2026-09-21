const API_URL = 'http://localhost:3000';

async function runTests() {
  console.log('--- Iniciando pruebas de integración ---');
  let token = '';
  let userId = '';
  const testEmail = `test_${Date.now()}@ejemplo.com`;

  try {
    // 1. Registro
    console.log('\n[1] Probando /auth/register...');
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Usuario Prueba',
        email: testEmail,
        password: 'password123',
        role: 'walker', // probamos registrar un paseador
        city: 'Cipolletti',
        phone: '2991234567'
      })
    });
    const regData = await regRes.json();
    if (!regRes.ok) throw new Error(JSON.stringify(regData));
    console.log('Registro exitoso:', regData);

    // 2. Login
    console.log('\n[2] Probando /auth/login...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(JSON.stringify(loginData));
    console.log('Login exitoso. Token obtenido.');
    token = loginData.access_token;
    userId = loginData.user.id || loginData.user._id;
    console.log('userId:', userId);

    // 3. Modificar perfil
    console.log('\n[3] Probando actualización de perfil...');
    const updateRes = await fetch(`${API_URL}/users/${userId}/caregiver-profile`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        bio: 'Paseador con 5 años de experiencia',
        services: ['Paseo 1 hr', 'Guardería']
      })
    });
    const updateData = await updateRes.json();
    if (!updateRes.ok) throw new Error(JSON.stringify(updateData));
    console.log('Perfil actualizado:', updateData);

    // 4. Obtener perfil
    console.log('\n[4] Probando obtención de perfil...');
    const getRes = await fetch(`${API_URL}/users/${userId}/caregiver-profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const getData = await getRes.json();
    if (!getRes.ok) throw new Error(JSON.stringify(getData));
    console.log('Perfil obtenido:', getData);

    console.log('\n--- Todas las pruebas pasaron correctamente ---');

  } catch (error) {
    console.error('\n!!! Error en las pruebas !!!');
    console.error(error.message);
  }
}

runTests();
