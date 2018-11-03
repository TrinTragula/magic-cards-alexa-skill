# An Alexa Skill for Magic: The Gathering

Ask Alexa to find Magic: The Gathering cards from a comprehensive online database. Simply ask: "Alexa, ask magic cards to find Black Cat"

## Details

A simple skill that will let you ask Alexa for details about almost all Magic: The Gathering cards, simply asking for their name. Activating this skill will be incredibly easy: it'll be enough to simply say "Alexa, ask magic cards to find Black Cat". Alexa will try her best to identify your desired card and provide you with a comprehensive description. Though, because of Alexa voice recognition software limits, it will be very hard to identify names based on made up words or very exotic terms (like, and this makes me very sad, the awesome Ornithopter). Nevertheless, this skill should still be perfectly working with names composed of words coming from a standard dictionary.

## Techncial details

This skill is built upon the awesome https://magicthegathering.io APIs, togheter with an online database I found here to try and translate most card to the italian language (this skill tries to be bilingual). There is a lot of room for improvement: Alexa does all the hard work, but I should try to implement some logic to try and understand Magic card names from the interpretation Alexa gave of the card name the user tried to tell her. This was an example skill I made to try out Alexa skills development, so don't expect a lot of updates.

### Sample usage:
> Alexa, ask magic cards to find Black Cat

> Alexa, ask magic cards to find Fireball

> Alexa, ask magic cards to find Vampire Aristocrat