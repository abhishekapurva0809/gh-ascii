export interface ProfileConfig {
  /** GitHub username to fetch stats for */
  username: string;

  /** Environment details displayed in the profile card */
  env: {
    os?: string;
    /** Use "auto" to dynamically compute uptime from GitHub account creation date, or specify a custom string */
    uptime?: string;
    host?: string;
    kernel?: string;
    ide?: string;
  };

  /** Categorized programming languages, web tech, tools, and spoken languages */
  languages: {
    programming?: string[];
    web?: string[];
    tools?: string[];
    real?: string[];
  };

  /** Personal hobbies and interests */
  hobbies: {
    software?: string[];
    hardware?: string[];
  };

  /** Contact and social media handles */
  contact: {
    email?: string;
    website?: string;
    github?: string;
    linkedin?: string;
    discord?: string;
  };
}

export const profileConfig: ProfileConfig = {
  username: "abhishekapurva0809",
  env: {
    os: "Windows 11",
    uptime: "auto", // Automatically calculated from GitHub account creation date
    host: "Developer Workstation",
    kernel: "NT 10.0",
    ide: "VS Code / Cursor",
  },
  languages: {
    programming: ["TypeScript", "JavaScript", "Python", "C++"],
    web: ["React", "Next.js", "Tailwind CSS", "HTML/CSS"],
    tools: ["Git", "Bun", "Node.js", "Docker"],
    real: ["English", "Hindi"],
  },
  hobbies: {
    software: ["Open Source", "Web Development", "AI Agents"],
  },
  contact: {
    email: "abhishekapurva09.08@gmail.com",
    website: "https://portfolio-website-two-delta-41.vercel.app/",
    github: "https://github.com/abhishekapurva0809",
    linkedin: "https://linkedin.com/in/abhishekapurva",
    discord: "abhishekapurva0809",
  },
};
