# Agent Prompt: Recreating the "Results and Discussion" Chapter

Use this prompt when tasking an AI agent to document a new application (like the Dispatch Admin Dashboard) following the established "Chapter 5" style.

---

**Task:** Generate a "Results and Discussion" documentation section for [App Name, e.g., Dispatch Admin Dashboard] following the "Chapter 5" template.

**Requirements:**

1.  **Structure:** Use the hierarchical numbering starting from [Section Number, e.g., 5.2].
2.  **Visuals (Figures):** For every page or major component, provide a Figure label (e.g., *Figure 5.2.1 The Dashboard Overview*). **Important: Each "Figure" represents a picture or screenshot of the actual content/page being described.** Leave a placeholder (or instruct the user to insert) the image immediately following the Figure label.
3.  **Descriptions:** Write a paragraph directly underneath each figure following these constraints:
    *   **Length:** Exactly 2 to 4 sentences per paragraph.
    *   **Content:** The first sentence must state what the page or component is. Subsequent sentences must explain how it functions, its core features, data inputs, or navigation routes.
    *   **Tone:** Technical, objective, literal, and descriptive. Avoid marketing jargon.
4.  **Logic:** Follow the logical flow of the application's user journey. For an admin dashboard, this might be: Login → Overview/Stats → Resource Management (e.g., Officers, Hotlines) → Incident Management → System Configuration.

**Reference Tone Example:**
"This is the login page of the main application. It requires an email address and password. It also has the feature forgot password that has the function to reset password and send reset link to email."