/* =========================================================
   JOURNAL CARD RENDERER — shared by the homepage teaser and the
   full journal index. Fetches posts.json, sorts newest-first, and
   renders simple cards. No framework, no build step: adding a post
   means adding one entry here and one HTML file next to this one.
========================================================= */

function renderJournalCards(container, posts, opts) {
  const basePath = (opts && opts.basePath) || "";
  const limit = (opts && opts.limit) || posts.length;

  const sorted = posts.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  const shown = sorted.slice(0, limit);

  container.innerHTML = shown.map((post) => {
    const dateLabel = new Date(post.date + "T00:00:00").toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
    return `
      <a class="post-card" href="${basePath}${post.slug}.html" data-reveal-up>
        <div class="post-card__meta">
          <span class="post-card__date">${dateLabel}</span>
          <span class="post-card__tag">${post.tag}</span>
        </div>
        <h3 class="post-card__title">${post.title}</h3>
        <p class="post-card__excerpt">${post.excerpt}</p>
      </a>
    `;
  }).join("");

  if (window.observeReveals) window.observeReveals(container);
}

function loadJournalPosts(basePath) {
  return fetch((basePath || "") + "posts.json")
    .then((r) => r.json())
    .catch(() => []);
}
