/**
@template {{ [N in string]: unknown[] }} Map
*/ export class CustomEventHandler
{
    /**
    @type {{ [N in keyof Map]?: ((...args: Map[N]) => void)[] }}
    @private*/ _listenerMap = {};

    /**
    @public*/ constructor() { }

    /**
    @template {keyof Map} N
    @param {N} type
    @param {(...args: Map[N]) => void} listener
    @public*/ addEventListener(type, listener)
    {
        const listeners = this._listenerMap[type];
        if (listeners === undefined)
            this._listenerMap[type] = [listener];
        else
            listeners.push(listener);
    }

    /**
    @template {keyof Map} N
    @param {N} type
    @param {(...args: Map[N]) => void} listener
    @public*/ removeEventListener(type, listener)
    {
        const listeners = this._listenerMap[type];
        if (listeners === undefined)
            return;

        const index = listeners.indexOf(listener);
        if (index === -1)
            return;

        listeners.splice(index, 1);
    }

    /**
    @template {keyof Map} N
    @param {N} type
    @param {Map[N]} args
    @public*/ dispatchEvent(type, ...args)
    {
        const listeners = this._listenerMap[type];
        if (listeners === undefined)
            return;

        for (const listener of listeners)
            listener(...args);
    }
}

/**
@template {unknown[]} Args
*/ export class SingleEventHandler
{
    /**
    @type {((...args: Args) => void)[]}
    @private*/ _listeners = [];

    /**
    @public*/ constructor() { }

    /**
    @param {(...args: Args) => void} listener
    @public*/ addEventListener(listener)
    {
        if (this._listeners === undefined)
            this._listeners = [listener];
        else
            this._listeners.push(listener);
    }

    /**
    @param {(...args: Args) => void} listener
    @public*/ removeEventListener(listener)
    {
        const listeners = this._listeners;
        if (listeners === undefined)
            return;

        const index = listeners.indexOf(listener);
        if (index === -1)
            return;

        listeners.splice(index, 1);
    }

    /**
    @param {Args} args
    @public*/ dispatchEvent(...args)
    {
        const listeners = this._listeners;
        if (listeners === undefined)
            return;

        for (const listener of listeners)
            listener(...args);
    }
}