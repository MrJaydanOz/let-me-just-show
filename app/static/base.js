import { SingleEventHandler } from "./custom-event-handler.js";
import { SentenceDropdown } from "./sentence-dropdown.js";
import { } from "./inline-include.js";
import { } from "./perspective-container.js";

/**
*/ export const staticRoot = "/s";

/**
@param {number} value
@param {number} length
*/ export function mod(value, length)
{
    return value < 0 ? (value % length) + length : value % length;
}

/**
@type {SingleEventHandler<[event: {
    syncId: string,
    sentence: SentenceDropdown,
    dropdownIndex: number,
    dropdownValue: number,
}]>}
*/ export const syncedSentence = new SingleEventHandler();

// Listens for changes in the dropdown values of sentences with the attribute "sync-id" and calls 'setDropdownValue()' for other sentences with a matching id.
window.addEventListener("load", () =>
{
    const syncMap = /** @type {{ [K in string]?: { sentence: SentenceDropdown, observer: MutationObserver, dispose: () => void }[] }} */({});

    /**
    @param {SentenceDropdown} sentence
    @param {string} syncId
    */ function _removeFromSyncMap(sentence, syncId)
    {
        const syncList = syncMap[syncId];
        if (syncList !== undefined)
        {
            const index = syncList.findIndex((v) => v.sentence === sentence);
            if (index !== -1)
            {
                syncList[index].dispose();
                syncList.splice(index, 1);
            }
        }
    }

    /**
    @param {SentenceDropdown} sentence
    @param {string} syncId
    */ function _addToSyncMap(sentence, syncId)
    {
        let syncList = syncMap[syncId];
        if (syncList === undefined)
        {
            syncList = [];
            syncMap[syncId] = syncList;
        }
        
        const observer = new MutationObserver((records) =>
        {
            const releventRecord = records.findLast((v) => v.attributeName === "sync-id");
            if (releventRecord === undefined)
                return;

            if (releventRecord.oldValue !== null)
                _removeFromSyncMap(sentence, releventRecord.oldValue);

            _addToSyncMap(sentence, syncId);
        });
        observer.observe(sentence, { attributeFilter: ["sync-id"] });

        let loopPrevention = false;

        /**
        @type {SentenceDropdown["addSentenceChangedListener"] extends (listener: infer L) => void ? L : never}
        */ function onWordsChanged(e)
        {
            if (loopPrevention)
                return;

            loopPrevention = true;

            console.log("onWordsChanged", e, syncList);
            for (const synced of syncList ?? [])
                if (synced.sentence !== sentence)
                    synced.sentence.setSentence(e.array);

            loopPrevention = false;
        }
        sentence.addSentenceChangedListener(onWordsChanged);

        /**
        @type {SentenceDropdown["addDropdownValuesChangedListener"] extends (listener: infer L) => void ? L : never}
        */ function onDropdownValueChanged(e)
        {
            if (loopPrevention)
                return;

            loopPrevention = true;

            for (const synced of syncList ?? [])
                if (synced.sentence !== sentence)
                    synced.sentence.setAllDropdownValues(e.array);

            loopPrevention = false;

            if (e.newValues !== null)
                for (let i = e.index; i < e.index + e.newValues.length; i++)
                {
                    syncedSentence.dispatchEvent({
                        syncId: syncId,
                        sentence: sentence,
                        dropdownIndex: i,
                        dropdownValue: e.array[i],
                    });
                }
        }
        sentence.addDropdownValuesChangedListener(onDropdownValueChanged);

        syncList.push({
            sentence: sentence,
            observer: observer,
            dispose()
            {
                this.observer.disconnect();
                sentence.removeSentenceChangedListener(onWordsChanged);
                sentence.removeDropdownValuesChangedListener(onDropdownValueChanged);
            }
        });
    }

    /**
    @param {{ addedNodes: Iterable<Node>, removedNodes: Iterable<Node> }[]} records
    */ function onMutation(records)
    {
        for (const record of records)
        {
            for (const removedNode of record.removedNodes)
            {
                if (!(removedNode instanceof SentenceDropdown))
                    continue;

                const syncId = removedNode.getAttribute("sync-id");
                if (syncId === null)
                    continue;

                _removeFromSyncMap(removedNode, syncId);
            }

            for (const addedNode of record.addedNodes)
            {
                if (!(addedNode instanceof SentenceDropdown))
                    continue;

                const syncId = addedNode.getAttribute("sync-id");
                if (syncId === null)
                    continue;

                _addToSyncMap(addedNode, syncId);
            }
        }
    }

    onMutation([{ addedNodes: document.querySelectorAll("sentence-dropdown"), removedNodes: []}]);
    const mutationObserver = new MutationObserver(onMutation);
    mutationObserver.observe(document, { childList: true, subtree: true });
});

let dontScrollWhenSyncedSentenceChanged = false;
syncedSentence.addEventListener((e) =>
{
    if (dontScrollWhenSyncedSentenceChanged)
        return;

    document.getElementById(`page-${e.sentence.getDropdownTagOfValue(e.dropdownIndex, e.dropdownValue)}`)?.scrollIntoView({ behavior: "smooth" });
})

// Handles IntersectionObservers for syncing the title sentence with the body scrollbar.
window.addEventListener("load", () =>
{
    const observer = new IntersectionObserver((entries) => 
    {
        const releventEntry = entries.findLast((v) => v.isIntersecting);
        if (releventEntry === undefined)
            return;

        const oneOfTheSentences = /** @type {SentenceDropdown | null} */(document.querySelector("sentence-dropdown[sync-id='title']"));
        if (oneOfTheSentences === null)
            return;

        dontScrollWhenSyncedSentenceChanged = true;
        oneOfTheSentences.setDropdown("mode", releventEntry.target.getAttribute("scroll-sets-title-sentence") ?? 0);
        dontScrollWhenSyncedSentenceChanged = false;
    },
    { threshold: 0.6 });

    /**
    @param {{ addedNodes: Iterable<Node>, removedNodes: Iterable<Node> }[]} records
    */ function onMutation(records)
    {
        for (const record of records)
        {
            for (const removedNode of record.removedNodes)
            {
                if (!(removedNode instanceof Element))
                    continue;

                observer.unobserve(removedNode);
            }

            for (const addedNode of record.addedNodes)
            {
                if (!(addedNode instanceof Element) || !addedNode.hasAttribute("scroll-sets-title-sentence"))
                    continue;

                observer.observe(addedNode);
            }
        }
    }

    onMutation([{ addedNodes: document.querySelectorAll("[scroll-sets-title-sentence]"), removedNodes: []}]);
    const mutationObserver = new MutationObserver(onMutation);
    mutationObserver.observe(document, { childList: true, subtree: true });
});
