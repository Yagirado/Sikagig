import jokiIcon from "../assets/joki.webp";
import desainIcon from "../assets/desigin.webp";
import anterinIcon from "../assets/anterin.webp";
import codingIcon from "../assets/coding.webp";
import surveyIcon from "../assets/survey.webp";
import jastipIcon from "../assets/jastip.webp";
import antriinIcon from "../assets/antriin.webp";
import fisikIcon from "../assets/fisik.webp";
import curhatIcon from "../assets/curhat.webp";
import mabarIcon from "../assets/mabar.webp";
import fotoIcon from "../assets/foto.webp";
import editIcon from "../assets/edit.webp";
import randomIcon from "../assets/random.webp";

export const CATEGORIES = [
    { name: "Joki Tugas", image: jokiIcon },
    { name: "Desain Grafis", image: desainIcon },
    { name: "Anterin", image: anterinIcon },
    { name: "Coding", image: codingIcon },
    { name: "Survey & Data", image: surveyIcon },
    { name: "Jastip", image: jastipIcon },
    { name: "Antriin", image: antriinIcon },
    { name: "Fisik", image: fisikIcon },
    { name: "Curhat", image: curhatIcon },
    { name: "Hiburan & Mabar", image: mabarIcon },
    { name: "Fotografi & Video", image: fotoIcon },
    { name: "Editing", image: editIcon },
    { name: "Random", image: randomIcon },
];

export function getCategoryIcon(categoryName) {
    if (!categoryName) return randomIcon;
    const cleanName = categoryName.trim().toLowerCase();
    const found = CATEGORIES.find(
        (c) => c.name.toLowerCase() === cleanName || cleanName.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(cleanName)
    );
    return found ? found.image : randomIcon;
}
