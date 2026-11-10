// K-03: self-care activities. Static, pre-written, safe content. No medical claims.
// TODO(review by CECD counsellor): every activity's wording.

export interface Activity {
  slug: string;
  title: string;
  minutes: number;
  summary: string;
  steps: string[];
  breathing?: boolean; // shows the gentle breathing circle
}

export const ACTIVITIES: Activity[] = [
  {
    slug: "box-breathing",
    title: "Box breathing",
    minutes: 2,
    summary: "Slow, even breaths to help you feel calmer.",
    breathing: true,
    steps: ["Sit comfortably. Let your shoulders drop.", "Breathe in slowly while you count to 4.", "Hold your breath gently while you count to 4.", "Breathe out slowly while you count to 4.", "Wait while you count to 4. Then start again. Try it 4 times."],
  },
  {
    slug: "five-senses",
    title: "5-4-3-2-1: notice around you",
    minutes: 2,
    summary: "Use your senses to bring your mind back to right now.",
    steps: ["Name 5 things you can see.", "Name 4 things you can touch.", "Name 3 things you can hear.", "Name 2 things you can smell.", "Name 1 thing you can taste, or one thing you like about yourself."],
  },
  {
    slug: "sleep-wind-down",
    title: "Getting ready for sleep",
    minutes: 3,
    summary: "A short routine to help your body slow down at night.",
    steps: ["Put your phone or screen away a little before bed.", "Make your room a bit darker and quieter if you can.", "Lie down and let your body feel heavy, from your feet up to your head.", "Breathe slowly. If thoughts come, imagine them floating past like clouds.", "If you can't sleep, that's okay. Resting quietly still helps."],
  },
  {
    slug: "three-good-things",
    title: "Three good things",
    minutes: 2,
    summary: "Notice small good moments in your day.",
    steps: ["Think back over today.", "Find one small thing that went well, even something tiny.", "Find a second one. Maybe someone was kind, or you enjoyed a meal.", "Find a third one.", "If you like, write them in your journal."],
  },
  {
    slug: "talk-to-a-trusted-adult",
    title: "How to talk to a trusted adult",
    minutes: 3,
    summary: "It's okay to ask for help. Here's a simple way to start.",
    steps: ["Think of an adult you feel safe with: a teacher, a family member, your counsellor.", "Pick a quiet moment, or ask: “Can I talk to you about something?”", "You can start small: “I've been feeling…” or “Something is worrying me.”", "You don't have to say everything at once.", "If the first person doesn't help, try another trusted adult. You deserve to be heard."],
  },
  {
    slug: "if-someone-bullies-you",
    title: "If someone bullies you",
    minutes: 3,
    summary: "Bullying is never your fault. Here's what you can do.",
    steps: ["Remember: it is not your fault, and you don't have to deal with it alone.", "If it is safe, walk away and go somewhere with other people.", "Tell a trusted adult what happened, when and where.", "Stay close to friends who are kind to you.", "You can also message your counsellor from your space."],
  },
  {
    slug: "shake-and-stretch",
    title: "Shake it out",
    minutes: 1,
    summary: "A quick way to let go of tension in your body.",
    steps: ["Stand up if you can.", "Shake your hands for 10 seconds.", "Roll your shoulders back slowly 3 times.", "Stretch your arms up high, then let them drop.", "Take one slow, deep breath."],
  },
];

export const findActivity = (slug: string) => ACTIVITIES.find((a) => a.slug === slug);
