import { Loud } from "./loud.js";

/**
*/ export class SentenceDropdown extends HTMLElement
{
    /**
    @protected @readonly*/ static observedAttributes = /** @type {const} */(["sentence", "values"]);

    /**
    @public*/ constructor()
    {
        super();

        /**
        @private*/ this._ignoreAttributeCallback = false;

        /**
        @type {Loud<(string |
            {
                readonly name: string | null,
                readonly options: readonly
                {
                    readonly tag: string,
                    readonly label: string,
                }[],
            })[]>
        }
        @private*/ this._sentenceWords = new Loud([]);
        this._sentenceWords.addIndexListener((e) =>
        {
            if (e.oldValues !== null)
            {
                const endIndex = e.index + e.oldValues.length;
                for (let i = e.index; i < endIndex; ++i)
                {
                    const sentenceElement = this._sentenceElements[i];
                    if (sentenceElement instanceof HTMLElement)
                        sentenceElement.remove();
                    else
                        sentenceElement.container.remove();
                }

                this._sentenceElements.splice(e.index, e.oldValues.length);
            }

            if (e.newValues !== null)
            {
                let nextElement;
                if (e.index + 1 >= this._sentenceElements.length)
                    nextElement = null;
                else
                {
                    nextElement = this._sentenceElements[e.index + 1];

                    if (!(nextElement instanceof HTMLElement))
                        nextElement = nextElement.container;
                }

                const dropdownCountBeforeindex = e.array.slice(0, e.index).reduce((p, v) => typeof v === "string" ? p : p + 1, -1);
                let dropdownIndex = dropdownCountBeforeindex;

                this._sentenceElements.splice(e.index, 0, ...e.newValues.map((v, i) =>
                {
                    if (typeof v === "string")
                    {
                        const word = this.insertBefore(document.createElement("span"), nextElement);
                        word.textContent = v;
                        return word;
                    }
                    else
                    {
                        ++dropdownIndex;

                        const container = this.insertBefore(document.createElement("div"), nextElement);
                        const optionContainer = container.insertBefore(document.createElement("ul"), nextElement);
                        if (dropdownIndex < this._dropdownValues.length)
                            optionContainer.style.setProperty("--dropdown-index", String(this._dropdownValues.value[dropdownIndex]));
                        const options = v.options.map((w, ii) =>
                        {
                            const option = optionContainer.appendChild(document.createElement("li"));
                            option.textContent = typeof w === "string" ? w : w.label;

                            const optionDropdownIndex = dropdownIndex;
                            option.addEventListener("click", () => this.setDropdown(optionDropdownIndex, ii));
                            return option;
                        });

                        return {
                            container: container,
                            optionContainer: optionContainer,
                            options: options,
                        };
                    }
                }));

                this._dropdownValues.push(...new Array(dropdownIndex - dropdownCountBeforeindex).fill(0));
            }

            for (const sentenceElement of this._sentenceElements)
            {
                if (!(sentenceElement instanceof HTMLElement))
                    sentenceElement.container.style.setProperty("--dropdown-count", String(sentenceElement.options.length));
            }

            this._ignoreAttributeCallback = true;
            this.setAttribute("sentence", this._sentenceWords.value.map((v) => typeof v === "string" ? v : `[${v.name === null ? "" : v.name + ": "}${v.options.map((v) => v.tag === v.label ? v.tag : `${v.tag}=${v.label}`).join("; ")}]`).join(" "));
            this._ignoreAttributeCallback = false;
        });

        /**
        @type {Loud<number[]>}
        @private*/ this._dropdownValues = new Loud([]);
        this._dropdownValues.addIndexListener((e) =>
        {
            let dropdownIndex = -1;

            for (let i = 0; i < this._sentenceWords.value.length; ++i)
            {
                const sentenceWord = this._sentenceWords.value[i];
                if (typeof sentenceWord === "string")
                    continue;
    
                ++dropdownIndex;

                if (dropdownIndex < e.index)
                    continue;
    
                const sentenceElement = this._sentenceElements[i];
                if (sentenceElement instanceof HTMLElement)
                    throw 0;

                if (dropdownIndex < e.array.length)
                {
                    sentenceElement.container.style.setProperty("--dropdown-index", String(e.array[dropdownIndex]));
                    for (let ii = 0; ii < sentenceElement.options.length; ++ii)
                        sentenceElement.options[ii].ariaChecked = e.array[dropdownIndex] === ii ? "true" : null;
                }
                else
                {
                    sentenceElement.container.style.removeProperty("--dropdown-index");
                    for (let ii = 0; ii < sentenceElement.options.length; ++ii)
                        sentenceElement.options[ii].ariaChecked = null;
                }
            }

            this._ignoreAttributeCallback = true;
            this.setAttribute("values", e.array.join(", "));
            this._ignoreAttributeCallback = false;
        });

        /**
        @type {(HTMLElement | { container: HTMLElement, optionContainer: HTMLElement, options: HTMLElement[] })[]}
        @private*/ this._sentenceElements = [];
    }

    /**
    @type {SentenceDropdown["_dropdownValues"]["addIndexListener"]}
    @public*/ addDropdownValuesChangedListener(listener) { this._dropdownValues.addIndexListener(listener) }
    /**
    @type {SentenceDropdown["_dropdownValues"]["removeIndexListener"]}
    @public*/ removeDropdownValuesChangedListener(listener) { this._dropdownValues.removeIndexListener(listener) }

    /**
    @type {SentenceDropdown["_sentenceWords"]["addIndexListener"]}
    @public*/ addSentenceChangedListener(listener) { this._sentenceWords.addIndexListener(listener) }
    /**
    @type {SentenceDropdown["_sentenceWords"]["removeIndexListener"]}
    @public*/ removeSentenceChangedListener(listener) { this._sentenceWords.removeIndexListener(listener) }

    /**
    @param {string |
        readonly (string |
            readonly (string |
            {
                readonly tag: string,
                readonly label: string,
            })[] |
            {
                name: string | null,
                options: readonly (string |
                {
                    readonly tag: string,
                    readonly label: string,
                })[]
            })[]
    } words
    @public*/ setSentence(words)
    {
        if (typeof words === "string")
        {
            const matches = words?.matchAll(/([^\[\]\s]+)|\[([^\[\]]+)\]/g) ?? [];
            const newSentence = /** @type {(string | { name: string | null, options: { tag: string, label: string }[] })[]} */([]);
            for (const match of matches)
            {
                if (match[1] !== undefined)
                    newSentence.push(match[1]);
                else if (match[2] !== undefined)
                {
                    let tag = /** @type {string | null} */(null);
                    const options = /** @type {{ tag: string, label: string }[]} */([]);

                    for (const optionMatch of match[2].matchAll(/^(\w+):|((?=\S)[^;:=]+(?<=\S))(?:\s*=\s*((?=\S)[^;:=]+(?<=\S)|))?/g))
                    {
                        if (optionMatch[1] !== undefined)
                            tag = optionMatch[1];
                        else
                            options.push({ tag: optionMatch[2], label: optionMatch[3] ?? optionMatch[2] });
                    }

                    newSentence.push({ name: tag, options: options });
                }
            }

            this._sentenceWords.value = newSentence;
        }
        else
            this._sentenceWords.value = words.map((v) =>
                typeof v === "string" ? v :
                v instanceof Array
                ? { 
                    name: null,
                    options: v.map((v) => typeof v === "string"
                    ? {
                        tag: v,
                        label: v,
                    }
                    : {
                        tag: v.tag,
                        label: v.label,
                    }),
                }
                : {
                    name: v.name,
                    options: v.options.map((v) => typeof v === "string"
                    ? {
                        tag: v,
                        label: v,
                    }
                    : {
                        tag: v.tag,
                        label: v.label,
                    }),
                });
    }
    
    /**
    @param {string} name
    @returns {number | null}
    @public*/ getIndexOfDropdownWithName(name)
    {
        let index = 0;
        for (const sentenceWord of this._sentenceWords.value)
        {
            if (typeof sentenceWord === "string")
                continue;

            if (sentenceWord.name !== name)
            {
                ++index;
                continue;
            }

            return index;
        }

        return null;
    }

    /**
    @param {number} index
    @returns {string | null}
    @public*/ getNameOfDropdownAtIndex(index)
    {
        if (index < 0)
            return null;

        for (const sentenceWord of this._sentenceWords.value)
        {
            if (typeof sentenceWord === "string")
                continue;

            --index;

            if (index < 0)
                return sentenceWord.name;
        }

        return null;
    }

    /**
    @overload
    @param {number} index
    @param {string} tag
    @returns {number | null}

    @overload
    @param {string} name
    @param {string} tag
    @returns {number | null}

    @param {number | string} key
    @param {string} tag
    @returns {number | null}
    @public*/ getDropdownValueOfTag(key, tag)
    {
        if (typeof key === "string")
            key = this.getIndexOfDropdownWithName(key) ?? -1;

        if (key < 0)
            return null;

        let dropdownIndex = -1;

        for (const sentenceWord of this._sentenceWords.value)
        {
            if (typeof sentenceWord === "string")
                continue;

            ++dropdownIndex;

            if (dropdownIndex < key)
                continue;

            const index = sentenceWord.options.findIndex((v) => v.tag === tag);
            return index < 0 ? null : index;
        }

        return null;
    }

    /**
    @overload
    @param {number} index
    @param {number} value
    @returns {string | null}

    @overload
    @param {string} name
    @param {number} value
    @returns {string | null}

    @param {number | string} key
    @param {number} value
    @returns {string | null}
    @public*/ getDropdownTagOfValue(key, value)
    {
        if (typeof key === "string")
            key = this.getIndexOfDropdownWithName(key) ?? -1;

        if (key < 0)
            return null;

        let dropdownIndex = -1;

        for (const sentenceWord of this._sentenceWords.value)
        {
            if (typeof sentenceWord === "string")
                continue;

            ++dropdownIndex;

            if (dropdownIndex < key)
                continue;

            return sentenceWord.options[value].tag;
        }

        return null;
    }

    /**
    @overload
    @param {number} index
    @param {number} value
    @returns {string | null}

    @overload
    @param {string} name
    @param {number} value
    @returns {string | null}

    @param {number | string} key
    @param {number} value
    @returns {string | null}
    @public*/ getDropdownLabelOfValue(key, value)
    {
        if (typeof key === "string")
            key = this.getIndexOfDropdownWithName(key) ?? -1;

        if (key < 0)
            return null;

        let dropdownIndex = -1;

        for (const sentenceWord of this._sentenceWords.value)
        {
            if (typeof sentenceWord === "string")
                continue;

            ++dropdownIndex;

            if (dropdownIndex < key)
                continue;

            return sentenceWord.options[value].label;
        }

        return null;
    }

    /**
    @overload
    @param {number} index
    @returns {number}

    @overload
    @param {string} name
    @returns {number}

    @param {number | string} key
    @returns {number} 
    @public*/ getDropdown(key)
    {
        if (typeof key === "string")
            key = this.getIndexOfDropdownWithName(key) ?? -1;

        if (key < 0)
            return 0;

        for (let i = 0; i < this._sentenceWords.value.length; ++i)
        {
            const sentenceWord = this._sentenceWords.value[i];
            if (typeof sentenceWord === "string")
                continue;

            if (key > 0)
            {
                --key;
                continue;
            }

            return this._dropdownValues.value[key];
        }

        return 0;
    }

    /**
    @param {string | readonly (number | string)[] | { readonly [K in string]: (number | string) }} words
    @public*/ setAllDropdownValues(words)
    {
        if (typeof words === "string")
        {
            this._dropdownValues.value = [];

            let i = -1;
            for (const match of words.matchAll(/\d+|(?<q>["'`])(.*?)\k<q>/g))
                this.setDropdown(++i, match[2] === undefined ? match[0] : Number.parseInt(match[2]));
        }
        else if (words instanceof Array)
        {
            this._dropdownValues.value = [];

            for (let i = 0; i < words.length; ++i)
                this.setDropdown(i, words[i]);
        }
        else
        {
            this._dropdownValues.value = [];

            for (const key in words)
                this.setDropdown(key, words[key]);
        }
    }

    /**
    @overload
    @param {number} index
    @param {number | string} value
    @returns {void}

    @overload
    @param {string} name
    @param {number | string} value
    @returns {void}

    @param {number | string} key
    @param {number | string} value 
    @public*/ setDropdown(key, value)
    {
        if (typeof key === "string")
            key = this.getIndexOfDropdownWithName(key) ?? -1;

        if (key < 0)
            return 0;

        const dropdownIndex = key;
        for (let i = 0; i < this._sentenceWords.value.length; ++i)
        {
            const sentenceWord = this._sentenceWords.value[i];
            if (typeof sentenceWord === "string")
                continue;

            if (key > 0)
            {
                --key;
                continue;
            }

            if (typeof value === "string")
                value = sentenceWord.options.findIndex((v) => v.tag === value);

            this._dropdownValues.extendTo(dropdownIndex, value, 0);

            break;
        }
    }

    /**
    @param {typeof SentenceDropdown.observedAttributes[number]} attributeName
    @param {string | null} oldValue
    @param {string | null} newValue
    @protected*/ attributeChangedCallback(attributeName, oldValue, newValue)
    {
        if (this._ignoreAttributeCallback)
            return;

        switch (attributeName)
        {
            case "sentence":
                this.setSentence(newValue ?? "");
                break;
            case "values":
                this.setAllDropdownValues(newValue ?? "");
                break;
        }
    }
}
customElements.define("sentence-dropdown", SentenceDropdown);