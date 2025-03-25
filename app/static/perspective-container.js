/**
*/ export class PerspectiveContainer extends HTMLElement
{
    /**
    @protected @readonly*/ static observedAttributes = /** @type {const} */(["perspective"]);
    /**
    @private*/ _lastVanishingPoint = 0.0;
    /**
    @private*/ _doUpdating = false;

    /**
    @public*/ constructor()
    {
        super();

        this.attributeChangedCallback("perspective", null, null);
    }

    /**
    @protected*/ connectedCallback()
    {
        this._doUpdating = true;

        this._update();
    }

    /**
    @protected*/ disconnectedCallback()
    {
        this._doUpdating = false;
    }

    /**
    @private @readonly*/ _update = () =>
    {
        if (!this._doUpdating)
            return;

        const rect = this.getBoundingClientRect();
        const vanishingPoint = (window.innerHeight * 0.5) - (rect.top);
        if (vanishingPoint !== this._lastVanishingPoint)
        {
            this._lastVanishingPoint = vanishingPoint;

            this.style.perspectiveOrigin = `center ${vanishingPoint}px`;
            this.style.transform = `translate3d(0, 0, 0)`;
        }

        requestAnimationFrame(this._update);
    }

    /**
    @param {typeof PerspectiveContainer.observedAttributes[number]} attributeName
    @param {string | null} oldValue
    @param {string | null} newValue
    @protected*/ attributeChangedCallback(attributeName, oldValue, newValue)
    {
        switch (attributeName)
        {
            case "perspective":
                this.style.perspective = newValue ?? "100vw";
                break;
        }
    }
}
customElements.define("perspective-container", PerspectiveContainer);