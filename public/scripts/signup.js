document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await axios.post('/auth/signup', { name, email, password });

    localStorage.setItem('token', res.data.token);
    notify({ type: 'success', message: 'Signup successful! Redirecting...' });
    setTimeout(() => {
      window.location.href = '/auth/login';
    }, 2000);
  } catch (err) {
    const msg = err.response?.data?.message || 'Signup failed';
    notify({ type: 'error', message: msg });
  }
});
