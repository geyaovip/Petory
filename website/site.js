(() => {
  const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase()
  document.querySelectorAll('.nav-links a').forEach((link) => {
    const href = (link.getAttribute('href') || '').split('#')[0].toLowerCase()
    if (href === current) {
      link.classList.add('is-active')
      link.setAttribute('aria-current', 'page')
    }
  })
})()
