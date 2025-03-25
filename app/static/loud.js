/**
@export
@template T
@typedef {(event: { oldValue: T, newValue: T }) => void} LoudListener<T>
*/

/**
@export
@template T
@typedef {T extends (infer E)[] ? ((event: { index: number, array: Readonly<T & unknown[]> } & (
    | { method: "insert", oldValues: null, newValues: E[] }
    | { method: "remove", oldValues: E[], newValues: null }
    | { method: "splice", oldValues: E[], newValues: E[] }
)) => void) : never} LoudIndexListener<T>
*/

/**
@export
@template T
@typedef {T extends Loud<infer V> ? V : never} ValueOfLoud<T>
*/

/**
A wrapper for a value with change listeners that can be set with 'addListener()'. If the value is an array, functions like 'push()' and 'pop()' can be used and listened to via 'addIndexListener()'
@template T
*/ export class Loud
{
    /**
    @param {T} startValue
    @public*/ constructor(startValue)
    {
        /**
        @type {T}
        @private*/ this._value = startValue;
        /**
        @type {LoudListener<T>[]}
        @private*/ this._listeners = [];
        /**
        @type {LoudIndexListener<T>[]}
        @private*/ this._indexListeners = [];
    }

    /**
    Gets the value this this Loud represents.
    @type {Readonly<T>}
    @public*/ get value() { return this.get() }
    /**
    Sets the value of this Loud and calls all its listeners.
    @public*/ set value(value) { this.set(value) }
    
    /**
    Gets the length of the Loud's array.
    @type {T extends unknown[] ? number : undefined}
    @public*/ get length()
    {
        if (!(this._value instanceof Array)) // @ts-ignore
            return undefined;

        // @ts-ignore
        return this._value.length;
    }

    /**
    Gets the value this this Loud represents.
    @return {Readonly<T>}
    @public*/ get()
    {
        return this._value;
    }
    /**
    Sets the value of this Loud and calls all its listeners.
    @param {Readonly<T>} value
    @public*/ set(value)
    {
        const oldValue = this._value;
        this._value = value;

        for (const listener of this._listeners)
            listener({
                oldValue: oldValue,
                newValue: value,
            });

        if (!(this._value instanceof Array))
            return;

        for (const listener of this._indexListeners)
            listener({
                index: 0,
                array: this._value,
                method: "splice",
                // @ts-ignore
                oldValues: oldValue,
                // @ts-ignore
                newValues: value,
            });
    }

    /**
    Gets the value at the given index. 
    @param {number} index
    @return {T extends (infer E)[] ? E : undefined}
    @public*/ getAt(index)
    {
        if (!(this._value instanceof Array)) // @ts-ignore
            return undefined;

        // @ts-ignore
        return this._value[index];
    }
    /**
    Sets the value at the given index and calls all its listeners.
    @param {number} index
    @param {T extends (infer E)[] ? E : never} value
    @return {T extends unknown[] ? boolean : false}
    @public*/ setAt(index, value)
    {
        if (!(this._value instanceof Array) || !Number.isInteger(index) || index < 0 || index >= this._value.length) // @ts-ignore
            return false;

        const oldValue = this._value[index];
        // @ts-ignore
        this.value[index] = value;

        for (const listener of this._indexListeners)
            listener({
                index: index,
                array: this._value,
                method: "splice",
                oldValues: [oldValue],
                newValues: [value],
            });

        // @ts-ignore
        return true;
    }
    /**
    Sets the value at the given index like 'setAt()' except that the index can be higher than length and the 'fillerValue' will be used to fill the empty slots.
    @param {number} index
    @param {T extends (infer E)[] ? E : never} value
    @param {T extends (infer E)[] ? E : never} fillerValue
    @return {T extends unknown[] ? boolean : false}
    @public*/ extendTo(index, value, fillerValue)
    {
        if (!(this._value instanceof Array) || !Number.isInteger(index) || index < 0) // @ts-ignore
            return false;

        if (index < this._value.length)
            return this.setAt(index, value);
        else if (index === this._value.length) // @ts-ignore
            return this.push(value) > 0;
        else // @ts-ignore
            return this.push(...new Array(index - this._value.length).fill(fillerValue), value) > 0;
    }

    /**
    Invokes the stardard 'push()' function on the Loud's array and calls all its listeners.
    @param {T extends (infer E)[] ? E[] : never} items
    @returns {T extends unknown[] ? number : 0}
    @public*/ push(...items)
    {
        if (!(this._value instanceof Array)) // @ts-ignore
            return 0;

        this._value.push(...items);

        for (const listener of this._indexListeners)
            listener({
                index: this._value.length - 1,
                array: this._value,
                method: "insert",
                oldValues: null,
                newValues: items,
            });

        // @ts-ignore
        return items.length;
    }

    /**
    Invokes the stardard 'pop()' function on the Loud's array and calls all its listeners.
    @returns {T extends (infer E)[] ? E | undefined : undefined}
    @public*/ pop()
    {
        if (!(this._value instanceof Array) || this._value.length <= 0) // @ts-ignore
            return undefined;

        const oldValue = this._value.pop();

        for (const listener of this._indexListeners)
            listener({
                index: this._value.length,
                array: this._value,
                method: "remove",
                oldValues: [oldValue],
                newValues: null,
            });

        return oldValue;
    }

    /**
    Invokes the stardard 'splice()' function on the Loud's array and calls all its listeners.
    @param {number} start
    @param {number} deleteCount
    @param {T extends (infer E)[] ? E[] : never} items
    @returns {T extends (infer E)[] ? E[] : []}
    @public*/ splice(start, deleteCount = -1, ...items)
    {
        if (!(this._value instanceof Array) || start >= this._value.length || start < -this._value.length) // @ts-ignore
            return [];

        const oldValues = this._value.splice(start, deleteCount, ...items);
        deleteCount = oldValues.length;

        for (const listener of this._indexListeners)
            listener({
                index: start < 0 ? this._value.length + start : start,
                array: this._value,
                method: "splice",
                oldValues: oldValues,
                newValues: items,
            });

        // @ts-ignore
        return oldValues;
    }

    /**
    Adds a new listener that will be called when this Loud's value is changed.
    @param {LoudListener<T>} listener
    @public*/ addListener(listener)
    {
        this._listeners.push(listener);
    }
    /**
    @param {LoudListener<T>} listener
    @public*/ removeListener(listener)
    {
        const index = this._listeners.indexOf(listener);
        if (index < 0)
            this._listeners.splice(index, 1);
    }

    /**
    Adds a new listener that will be called when an element in this Loud's array is changed.
    @param {LoudIndexListener<T>} listener
    @public*/ addIndexListener(listener)
    {
        this._indexListeners.push(listener);
    }
    /**
    @param {LoudIndexListener<T>} listener
    @public*/ removeIndexListener(listener)
    {
        const index = this._indexListeners.indexOf(listener);
        if (index < 0)
            this._listeners.splice(index, 1);
    }
}