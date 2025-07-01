document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await axios.post('http://localhost:3000/auth/login', { email, password });

    localStorage.setItem('token', res.data.token);
    notify({ type: 'success', message: 'Login successful!' });


    setTimeout(() => {
        window.location.href = '/user/update-profile';
    }, 1500);

  } catch (err) {
    const msg = err.response?.data?.message || 'Login failed';
    notify({ type: 'error', message: msg });
  }
});
