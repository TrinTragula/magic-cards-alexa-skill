const mtg = require('mtgsdk');

const noColor = {
    "Default": "Colorless",
    "Italian": "Incolore"
}

const RARITY = {
    "Common": "Comune",
    "Uncommon": "Non comune",
    "Rare": "Rara",
    "Mythic Rare": "Rara mitica",
    "Special": "Speciale",
    "Basic Land": "Terra base"
}

const TYPES = {
    "Legendary Instant": "Istantaneo leggendario",
    "Instant": "Istantaneo",
    "Legendary Sorcery": "Stregoneria leggendaria",
    "Sorcery": "Stregoneria",
    "Legendary Artifact": "Artefatto leggendario",
    "Artifact": "Artefatto",
    "Legendary Creature": "Creatura leggendaria",
    "Creature": "Creatura",
    "Legendary Enchantment": "Incantesimo leggendario",
    "Enchantment": "Incantesimo",
    "Legendary Land": "Terra leggendaria",
    "Land": "Terra",
    "Legendary Planeswalker": "Planeswalker leggendario",
    "Planeswalker": "Planeswalker",
    "Legendary Tribal": "Tribale leggendario",
    "Tribal": "Tribale"
}

const TEXT_COMMON_WORDS = {
    "Prowess": "Prodezza",
    "Scry": "Profetizzare",
    "Reach": "Raggiungere",
    "Haste": "Rapidità",
    "Regeneration": "Rigenerazione",
    "Deathtouch": "Tocco letale",
    "Trample": "Travolgere",
    "Flying": "Volare",
    "Hexproof": "Anti-malocchio",
    "Lifelink": "Legame vitale",
    "First strike": "Attacco improvviso",
    "Double strike": "Doppio attacco",
    "Vigilance": "Cautela",
    "Defender": "Difensore",
    "Equip": "Equipaggiare",
    "Indestructible": "Indistruttibile",
    "Flash": "Lampo"
}

const MESSAGES = {
    NOT_FOUND: {
        "Default": "I'm sorry, I couldn't find that card.",
        "Italian": "Carta non trovata, mi dispiace."
    },
    WITH: {
        "Default": "with",
        "Italian": "con"
    },
    COST: {
        "Default": "Mana cost",
        "Italian": "Costo mana"
    }
}

const colors = {
    "U": {
        "Default": "Blue",
        "Italian": "Blu"
    },
    "W": {
        "Default": "White",
        "Italian": "Bianca"
    },
    "B": {
        "Default": "Black",
        "Italian": "Nera"
    },
    "G": {
        "Default": "Green",
        "Italian": "Verde"
    },
    "R": {
        "Default": "Red",
        "Italian": "Rossa"
    }
}

class MTGWrapper {
    constructor(language = null) {
        this.language = language || "Default";
    }

    /**
     * Find a card by name 
     */
    getCardByName(name) {
        const notFound = {
            text: MESSAGES.NOT_FOUND[this.language],
            imageUrl: null
        };

        try {
            const self = this;
            const query = {
                name
            };
            query.language = self.language != "Default" ?
                self.language :
                null;

            return mtg.card.where(query)
                .then(result => {
                    if (!result || result.length == 0) {
                        return notFound;
                    }
                    const card = self.convertCard(result[0]);
                    return {
                        title: card.name,
                        text: self.cardToSpeech(card),
                        imageUrl: card.imageUrl
                    };
                })
                .catch(err => {
                    console.log(err);
                    return notFound;
                });
        } catch (ex) {
            console.log(ex);
            return notFound;
        }
    }

    /**
     * From API object to usefule object
     */
    convertCard(card) {
        const self = this;
        const simpleCard = {};
        const languageNameObj = card.foreignNames ? card.foreignNames.find(c => c.language == self.language) : null;
        simpleCard.name = languageNameObj && languageNameObj.name ?
            languageNameObj.name :
            card.name;
        simpleCard.power = card.power;
        simpleCard.toughness = card.toughness;
        simpleCard.text = card.text;
        simpleCard.color = card.colorIdentity ? card.colorIdentity.map(c => colors[c][this.language]).join(", ") : noColor[this.language];
        simpleCard.type = card.type;
        simpleCard.manaRaw = card.manaCost ? card.manaCost : "{0}";
        simpleCard.manaCost = card.manaCost ? self.manaCostToString(card.manaCost) : 0;
        simpleCard.imageUrl = card.imageUrl;
        simpleCard.rarity = card.rarity ? self.language == "Italian" && RARITY[card.rarity] ? RARITY[card.rarity] : card.rarity : null;
        // simpleCard.card = card;

        if (self.language == "Italian") {
            for (const type of Object.keys(TYPES)) {
                simpleCard.type = simpleCard.type.replace(type, TYPES[type]);
            }

            const loader = require('csv-load-sync');
            const csv = loader('cardlist.csv', {
                getColumns: (line) => line.split(';')
            });
            const engDict = csv.reduce((p, c) => {
                if (c.English) {
                    p[c.English] = c.Testo
                }
                return p;
            }, {});
            if (engDict[card.name]) {
                simpleCard.text = engDict[card.name];
            } else {
                for (const commonWord of Object.keys(TEXT_COMMON_WORDS)) {
                    simpleCard.text = simpleCard.text.replace(commonWord, TEXT_COMMON_WORDS[commonWord]);
                }
            }
        }

        return simpleCard;
    }

    manaCostToString(manaCost) {
        const keys = Object.keys(colors);
        const mana = {
            "B": 0,
            "W": 0,
            "U": 0,
            "G": 0,
            "R": 0,
            "no-color": 0
        }

        for (const char of manaCost) {
            if (keys.includes(char)) mana[char] += 1;
            const num = parseInt(char);
            if (num) mana["no-color"] += num;
        }

        let result = "";
        if (mana["no-color"] != 0) {
            result += `${mana["no-color"]} ${noColor[this.language]}`;
        }
        for (const key of keys) {
            if (mana[key] != 0) {
                if (result.length > 0) result += ",";
                result += ` ${mana[key]} ${colors[key][this.language]}`;
            }
        }
        return result;
    }

    cardToSpeech(card) {
        let result = `${card.name}. ${card.rarity} ${card.color}. ${card.type}.`;
        result += ` ${MESSAGES.COST[this.language]}: ${!card.manaCost ? "0 " + noColor[this.language] : card.manaCost}`;
        if (card.power || card.toughness) {
            result += ` ${MESSAGES.WITH[this.language]} ${card.power}-${card.toughness}.`;
        } else {
            result += ".";
        }
        let cleanText = card.text.replace(/\.\n/g, ". ");
        cleanText = card.text.replace(/\n/g, ". ");
        cleanText = cleanText.replace(/\{/g, " ");
        cleanText = cleanText.replace(/\}/g, "");
        result += ` ${cleanText}`;
        return result;
    }
}

// const wrp = new MTGWrapper("Italian");
// wrp.getCardByName("Palla di fuoco")
//     .then(card => {
//         console.log(card);
//     });


module.exports = MTGWrapper;