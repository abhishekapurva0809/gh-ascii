# gh-ascii — Custom GitHub Profile Card

> A customized fork of [`gh-ascii`](https://github.com/crafter-station/gh-ascii) for creating a terminal-style GitHub profile card with ASCII art, dynamic GitHub statistics, and personalized profile information.

![GitHub Profile Card](./dark_mode.svg)

---

## ✨ Features

* 🖼️ GitHub avatar converted into ASCII art
* 📊 Dynamic GitHub statistics
* 📦 Repository count
* ⭐ Stars
* 👥 Followers
* 💻 Programming languages
* 🧑‍💻 Custom developer information
* 🖥️ Environment information such as OS, IDE, and kernel
* 🎮 Custom hobbies and interests
* 📫 Contact and social links
* 🌙 Dark mode support
* ☀️ Light mode support
* ⚡ SVG-based output
* 🤖 Automatic profile card updates using GitHub Actions

---

## 🖥️ Profile Card

The generated card is designed in a terminal/neofetch-inspired style.

```text
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│   ASCII ART             ── username@github ────────────────  │
│                         OS:          Windows                  │
│                         IDE:         VS Code                  │
│                         Host:        Personal Computer        │
│                                                               │
│                         ── Languages ─────────────────────── │
│                         Programming: C++, JavaScript, Python  │
│                         Web:         HTML, CSS, React         │
│                                                               │
│                         ── Contact ───────────────────────── │
│                         GitHub:      username                 │
│                         LinkedIn:    profile                  │
│                                                               │
│                         ── GitHub Stats ──────────────────── │
│                         Repositories: ...                     │
│                         Commits:      ...                     │
│                         Stars:        ...                     │
│                         Followers:    ...                     │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/abhishekapurva0809/gh-ascii.git
cd gh-ascii
```

### 2. Install dependencies

```bash
bun install
```

### 3. Run the project

```bash
bun run dev
```

Follow the project's existing commands and configuration for generating the profile SVG.

---

## ⚙️ Configuration

Personal information can be customized without changing the core GitHub API functionality.

You can configure information such as:

```text
OS
Uptime
Host
Kernel
IDE

Programming Languages
Web Technologies
Tools
Real Languages

Hobbies
Email
Website
GitHub
LinkedIn
Discord
```

GitHub-related information should remain dynamic and be retrieved from GitHub rather than being manually hardcoded.

---

## 📊 Dynamic GitHub Statistics

GitHub statistics are generated from GitHub data.

Examples include:

* Repositories
* Commits
* Stars
* Followers
* Following
* Contributions
* Languages

This means you don't need to manually update your GitHub statistics whenever your profile changes.

For example:

```text
Before:

Commits: 120

        ↓ New GitHub activity

After:

Commits: 135
```

---

## 🤖 Automatic Updates

This customized version can use GitHub Actions to regenerate the profile card automatically.

The workflow can:

1. Fetch the latest GitHub information.
2. Run the profile card generator.
3. Generate the updated SVG.
4. Compare it with the previous version.
5. Commit changes only when the generated card changes.
6. Push the updated SVG to the profile repository.

The workflow can also be triggered manually using `workflow_dispatch`.

---

## 🧩 Using It on Your GitHub Profile

Place the generated SVG files in your GitHub profile repository.

For example:

```text
your-username/
└── your-username/
    ├── README.md
    ├── dark_mode.svg
    └── light_mode.svg
```

Then add the card to your `README.md`:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./dark_mode.svg">
  <source media="(prefers-color-scheme: light)" srcset="./light_mode.svg">
  <img alt="GitHub Profile Card" src="./dark_mode.svg">
</picture>
```

---

## 🛠️ Tech Stack

* TypeScript
* Bun
* GitHub API
* SVG
* GitHub Actions
* ASCII rendering

---

## 🎨 Customization

This project is based on the original `gh-ascii` project and has been customized to provide more control over the generated profile card.

The goal is to keep the original functionality while providing a more personalized developer-profile experience.

---

## 🙏 Credits

This project is a customized fork of:

**[crafter-station/gh-ascii](https://github.com/crafter-station/gh-ascii)**

Original project by **crafter-station**.

All original functionality and ideas belong to their respective authors.

This fork focuses on extending the design, customization, and automatic GitHub profile integration.

---

## 📄 License

See the original project's license and repository files for licensing information.

---

## ⭐ About

A personalized GitHub profile card generator combining **ASCII art + GitHub statistics + developer information** in a terminal-inspired SVG.

Built and customized by **Abhishek Apurva**.
