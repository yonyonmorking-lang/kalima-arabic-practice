# Kalima — Arabic word practice

A personal Arabic vocabulary trainer. Upload pictures, add translations, and practice in shuffled quizzes with a score out of 100.

## Features

- Upload multiple word pictures at once
- Add translations in English, Hebrew, Arabic, or another language
- Accept multiple answers separated by semicolons
- Earn points, replay rounds, and practice missed words
- Reveal an answer during a round for 0 points and automatically continue after 4 seconds
- Keep adding words after any round without replacing the existing collection
- Automatically save pictures and translations for future visits, request persistent browser storage, and fall back to localStorage if IndexedDB is unavailable
- Save detailed round history, including your answers and mistakes, in your browser with IndexedDB
- Reopen past rounds and practice their missed words
- Export and import JSON backups
- Responsive design for phones and desktops

## Hosting

This is a static website hosted by GitHub Pages, published from the root of the default branch. Push changes to update the live site.

## Local preview

Run `python3 -m http.server 4173` in this folder, then visit http://localhost:4173.

Pictures, translations, and scores are saved only in the current browser. They are never uploaded to this repository. To move a collection between browsers or devices, use Export backup and Import backup.
