<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Downingtown East Boys Volleyball</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    :root { --dt-blue: #003366; --dt-yellow: #FFD700; }
    body { font-family: "Roboto", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; }
    .bg-dt-blue { background-color: var(--dt-blue); }
    .text-dt-blue { color: var(--dt-blue); }
    .bg-dt-yellow { background-color: var(--dt-yellow); }
    .text-dt-yellow { color: var(--dt-yellow); }
    .border-dt-yellow { border-color: var(--dt-yellow); }
    /* Simple slideshow styles */
    .hero-slideshow { position: relative; width: 100%; height: 60vh; overflow: hidden; }
    .hero-slideshow img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 1s ease-in-out; }
    .hero-slideshow img.active { opacity: 1; }
  </style>
</head>
<body class="bg-gray-100">
  <header class="bg-dt-blue shadow-lg sticky top-0 z-50">
    <nav class="container mx-auto px-4 py-2 flex justify-between items-center">
      <a href="index.html" class="flex items-center gap-3">
        <!-- Replace with your logo -->
        <img src="/assets/logo.png" alt="Cougars Volleyball Logo" class="h-14 w-auto">
        <span class="text-white text-xl font-bold hidden md:block leading-tight">Downingtown East<br> Boys Volleyball</span>
      </a>
      <div class="flex items-center gap-4">
        <button id="mobile-menu-button" aria-controls="mobile-menu" aria-expanded="false" aria-label="Toggle navigation" class="md:hidden text-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <!-- 3 horizontal bars -->
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <!-- Desktop links -->
        <div class="hidden md:flex items-center space-x-2">
          <a href="index.html" class="px-4 py-2 text-white bg-white/20 rounded-md font-bold hover:bg-dt-yellow hover:text-dt-blue transition-colors">Home</a>
          <a href="schedule.html" class="px-4 py-2 text-white rounded-md hover:bg-dt-yellow hover:text-dt-blue transition-colors">Schedule</a>
          <a href="coaches.html" class="px-4 py-2 text-white rounded-md hover:bg-dt-yellow hover:text-dt-blue transition-colors">Coaches</a>
          <a href="contact.html" class="px-4 py-2 text-white rounded-md hover:bg-dt-yellow hover:text-dt-blue transition-colors">Contact</a>
        </div>
      </div>
    </nav>
    <!-- Mobile menu (initially hidden) -->
    <div id="mobile-menu" class="hidden md:hidden px-4 pt-2 pb-4 space-y-2">
      <a href="index.html" class="block text-center px-4 py-2 text-white bg-white/20 rounded-md font-bold">Home</a>
      <a href="schedule.html" class="block text-center px-4 py-2 text-white rounded-md">Schedule</a>
      <a href="coaches.html" class="block text-center px-4 py-2 text-white rounded-md">Coaches</a>
      <a href="contact.html" class="block text-center px-4 py-2 text-white rounded-md">Contact</a>
    </div>
  </header>

  <main>
    <section class="relative text-white text-center">
      <div class="hero-slideshow" aria-hidden="false">
        <!-- Replace with your images -->
        <img src="/assets/hero1.jpg" alt="Team action shot" class="active">
        <img src="/assets/hero2.jpg" alt="Team huddle">
        <img src="/assets/hero3.jpg" alt="Players on the court">
        <img src="/assets/hero4.jpg" alt="Team celebration">
      </div>
      <div class="absolute inset-0 bg-black/60 flex flex-col justify-center items-center p-4">
        <h1 class="text-4xl md:text-6xl font-black uppercase tracking-wider">Go East Cougars!</h1>
        <p class="text-lg md:text-2xl mt-4 font-light">Welcome to the official home of Downingtown East Boys Volleyball</p>
      </div>
    </section>
    <div class="container mx-auto p-4 md:p-8">
      <section class="grid md:grid-cols-3 gap-8 mb-12">
        <div class="bg-white rounded-lg shadow-xl p-6 text-center border-t-4 border-dt-blue">
          <h3 class="text-2xl font-bold text-dt-blue mb-4">NEXT GAME</h3>
          <p class="text-4xl font-black text-gray-800">TBD</p>
          <p class="text-xl text-gray-600 mt-2">2025 Season Schedule Coming Soon!</p>
          <a href="schedule.html" class="mt-6 inline-block w-full px-6 py-3 bg-dt-blue text-white font-bold rounded-lg hover:bg-blue-800 transition-colors">Full Schedule</a>
        </div>
        <div class="bg-white rounded-lg shadow-xl p-6 text-center border-t-4 border-gray-400">
          <h3 class="text-2xl font-bold text-gray-600 mb-4">LAST SEASON'S RECORD</h3>
          <p class="text-4xl font-black text-gray-800">14-6</p>
          <p class="text-xl text-gray-600 mt-2">Finished 2nd in Ches-Mont</p>
          <a href="https://www.maxpreps.com/pa/exton/downingtown-east-cougars/volleyball/boys/" target="_blank" rel="noopener noreferrer" class="mt-6 inline-block w-full px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition-colors">View MaxPreps</a>
        </div>
        <div class="bg-white rounded-lg shadow-xl p-6 text-center border-t-4 border-dt-yellow">
          <h3 class="text-2xl font-bold text-dt-blue mb-4">WATCH HIGHLIGHTS</h3>
          <p class="text-4xl font-black text-dt-yellow">HUDL</p>
          <p class="text-xl text-gray-600 mt-2">Catch up on all the action</p>
          <a href="https://fan.hudl.com/usa/pa/exton/organization/13507/downingtown-east-high-school/team/730061/boys-varsity-volleyball" target="_blank" rel="noopener noreferrer" class="mt-6 inline-block w-full px-6 py-3 bg-dt-yellow text-dt-blue font-bold rounded-lg hover:bg-yellow-500 transition-colors">Go to Hudl</a>
        </div>
      </section>
      <section class="bg-white rounded-lg shadow-xl p-6 md:p-8">
        <h2 class="text-3xl font-bold text-dt-blue border-b-4 border-dt-yellow pb-2 mb-6">Team Announcements</h2>
        <div class="space-y-6">
          <article class="p-4 border-l-4 border-dt-blue bg-blue-50 rounded-r-lg">
            <h3 class="font-bold text-xl text-gray-800">2025 Season Tryouts</h3>
            <time class="text-gray-500 text-sm mb-2 block">Posted on August 10, 2025</time>
            <p class="text-gray-700">Tryout dates and times for the upcoming 2025 season will be announced soon. Please check back for updates and make sure all your physical forms are submitted!</p>
          </article>
          <article class="p-4 border-l-4 border-gray-400 bg-gray-50 rounded-r-lg">
            <h3 class="font-bold text-xl text-gray-800">Congratulations to our Seniors!</h3>
            <time class="text-gray-500 text-sm mb-2 block">Posted on May 20, 2025</time>
            <p class="text-gray-700">A big thank you and congratulations to the graduating class of 2025 for a fantastic season. We wish you the best of luck in your future endeavors!</p>
          </article>
        </div>
      </section>
    </div>
  </main>

  <footer class="bg-dt-blue text-white mt-12">
    <div class="container mx-auto p-8">
      <div class="grid md:grid-cols-3 gap-8 text-center md:text-left">
        <div>
          <h4 class="font-bold text-lg mb-3">QUICK LINKS</h4>
          <ul class="space-y-2">
            <li><a href="schedule.html" class="hover:text-dt-yellow">Schedule</a></li>
            <li><a href="coaches.html" class="hover:text-dt-yellow">Coaches</a></li>
            <li><a href="contact.html" class="hover:text-dt-yellow">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-bold text-lg mb-3">CONTACT</h4>
          <p>Downingtown East High School</p>
          <p>50 Devon Dr, Exton, PA 19341</p>
          <a href="contact.html" class="hover:text-dt-yellow block mt-2">Contact the Coaches</a>
        </div>
        <div>
          <h4 class="font-bold text-lg mb-3">FOLLOW US</h4>
          <p>Links to social media coming soon!</p>
        </div>
      </div>
      <div class="text-center border-t border-white/20 mt-8 pt-6">
        <p>&copy; 2025 Downingtown East Boys Volleyball. All Rights Reserved.</p>
      </div>
    </div>
  </footer>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const btn = document.getElementById('mobile-menu-button');
      const menu = document.getElementById('mobile-menu');
      if (!btn || !menu) return;

      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        menu.classList.toggle('hidden');
      });

      // Simple slideshow
      const slides = document.querySelectorAll('.hero-slideshow img');
      if (slides.length > 1) {
        let i = 0;
        const show = (idx) => {
          slides.forEach((s, k) => s.classList.toggle('active', k === idx));
        };
        setInterval(() => { i = (i + 1) % slides.length; show(i); }, 5000);
      }
    });
  </script>
</body>
</html>
