/**
@param {string | URL} url
@param {boolean} rejectAsElement
@returns {Promise<Element>}
*/ export function requestElement(url, rejectAsElement = false)
{
    let promise = /** @type {Promise<Element>} */(new Promise((resolve, reject) =>
    {
        const request = new XMLHttpRequest();
        try
        {
            request.open("GET", url);
        }
        catch (e)
        {
            return reject(JSON.stringify(e));
        }

        request.addEventListener("load", () =>
        {
            if (typeof request.response === "string")
            {
                const root = new DOMParser().parseFromString(request.response, "text/xml").querySelector("*");
                if (root === null)
                    return reject(`Requested element doesn't have a root.`);

                return resolve(root);
            }
            else if (request.response instanceof Document)
            {
                const root = request.response.querySelector("*");
                if (root === null)
                    return reject(`Requested element doesn't have a root.`);

                return resolve(root);
            }
            else
                return reject(`Invalid response type from '${url}'`);
        });

        request.addEventListener("error", () =>
        {
            return reject(`Error requesting from '${url}'`);
        });

        request.send();
    }));

    if (rejectAsElement)
        promise = promise.catch((v) =>
        {
            const element = document.createElement("inline-error");
            const style = element.appendChild(document.createElement("style"));
            style.textContent = `inline-error, inline-error * { all: initial; color: red; }`;
            const header = element.appendChild(document.createElement("h1"));
            header.textContent = "Error in '<inline-include/>'";
            const content = element.appendChild(document.createElement("p"));
            content.textContent = JSON.stringify(v);
            return element;
        });

    return promise;
}

/**
*/ export class InlineInclude extends HTMLElement
{
    /**
    @protected @readonly*/ static observedAttributes = /** @type {const} */(["href"]);

    /**
    @public*/ constructor()
    {
        super();
    }

    /**
    @param {typeof InlineInclude.observedAttributes[number]} attributeName
    @param {string | null} oldValue
    @param {string | null} newValue
    @protected*/ attributeChangedCallback(attributeName, oldValue, newValue)
    {
        if (this.parentNode === null || attributeName !== "href" || newValue === null)
            return;

        requestElement(newValue, true).then((root) =>
        {
            if (this.parentNode === null)
                return;

            const nextSibling = this.nextSibling;

            if (root instanceof Element)
                for (const name of this.getAttributeNames())
                {
                    const value = this.getAttribute(name);
                    if (value === null)
                        continue;

                    root.setAttribute(
                        name === "href" ? "hrefFrom" :
                        name === "hrefName" ? "href" :
                        name, value);
                }

            this.parentNode.insertBefore(root, nextSibling);
            this.remove();
        });
    }
}
customElements.define("inline-include", InlineInclude);