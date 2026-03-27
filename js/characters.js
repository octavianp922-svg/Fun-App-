const CHARACTERS = {
    cristina: {
        name: "Cristina",
        role: "Mama",
        emoji: "\u{1F469}\u{200D}\u{1F9B0}",
        color: "#E91E63"
    },
    victor: {
        name: "Victor",
        role: "Copilul",
        emoji: "\u{1F466}",
        color: "#2196F3"
    },
    veroana: {
        name: "Veroana",
        role: "Bunica",
        emoji: "\u{1F475}",
        color: "#9C27B0"
    },
    arya: {
        name: "Arya",
        role: "Nepoata",
        emoji: "\u{1F467}",
        color: "#FF9800"
    },
    ana: {
        name: "Ana",
        role: "Mama Aryei",
        emoji: "\u{1F469}",
        color: "#4CAF50"
    },
    octavian: {
        name: "Octavian",
        role: "Tatal Aryei",
        emoji: "\u{1F468}",
        color: "#795548"
    },
    narrator: {
        name: "Narator",
        role: "",
        emoji: "\u{1F4D6}",
        color: "#78909C"
    }
};

const BACKGROUNDS = {
    airport:    "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
    beach:      "linear-gradient(180deg, #4facfe 0%, #00f2fe 30%, #f5af19 75%, #f12711 100%)",
    mountain:   "linear-gradient(180deg, #0f2027 0%, #203a43 30%, #2c5364 60%, #2ECC71 100%)",
    kitchen:    "linear-gradient(135deg, #FFECD2 0%, #FCB69F 50%, #ff9a9e 100%)",
    livingroom: "linear-gradient(135deg, #667eea 0%, #a18cd1 50%, #fbc2eb 100%)",
    car:        "linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    garden:     "linear-gradient(135deg, #11998e 0%, #38ef7d 50%, #56ab2f 100%)",
    night:      "linear-gradient(180deg, #0f0c29 0%, #1a1a4e 30%, #302b63 60%, #24243e 100%)",
    village:    "linear-gradient(180deg, #a8e063 0%, #56ab2f 40%, #DAD299 70%, #B0DAB9 100%)",
    party:      "linear-gradient(135deg, #f093fb 0%, #f5576c 33%, #4facfe 66%, #00f2fe 100%)",
    store:      "linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #636FA4 100%)",
    park:       "linear-gradient(135deg, #11998e 0%, #38ef7d 50%, #a8e063 100%)",
    christmas:  "linear-gradient(180deg, #0f3460 0%, #1B4332 30%, #2D6A4F 60%, #52b788 100%)"
};

const EPISODES = [
    {
        id: "episode1",
        file: "data/episode1.json",
        title: "Vacanta in familie",
        description: "Familia pleaca in vacanta. GPS-ul a innebunit, bagajele s-au pierdut, iar bunica are alte planuri.",
        number: 1
    },
    {
        id: "episode2",
        file: "data/episode2.json",
        title: "Cina de Craciun",
        description: "Bunica comanda in bucatarie, Victor improvizeaza, iar Arya decoreaza bradul... creativ.",
        number: 2
    },
    {
        id: "episode3",
        file: "data/episode3.json",
        title: "Ziua lui Victor",
        description: "O petrecere surpriza unde fiecare are o alta idee. Ce poate merge prost?",
        number: 3
    }
];
