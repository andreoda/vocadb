/// <reference path="../typings/knockout/knockout.d.ts" />
/// <reference path="../Shared/GlobalFunctions.ts" />
/// <reference path="../Shared/EntrySearchDrop.d.ts" />
/// <reference path="AutoCompleteParams.ts" />

interface KnockoutBindingHandlers {
    songAutoComplete: KnockoutBindingHandler;
}

// Song autocomplete search box.
ko.bindingHandlers.songAutoComplete = {
    init: (element: HTMLElement, valueAccessor) => {

        var properties: vdb.knockoutExtensions.AutoCompleteParams = ko.utils.unwrapObservable(valueAccessor());

		var filter = properties.filter;

		if (properties.ignoreId) {

			filter = (item: vdb.dataContracts.SongContract) => {

				if (properties.ignoreId && item.id == properties.ignoreId) {
					return false;
				}

				return properties.filter != null ? properties.filter(item) : true;

			}

		}

		var queryParams = { nameMatchMode: 'Auto', lang: vdb.models.globalization.ContentLanguagePreference[vdb.values.languagePreference] };
		if (properties.extraQueryParams)
			jQuery.extend(queryParams, properties.extraQueryParams);

        initEntrySearch(element, null, "Song", vdb.functions.mapAbsoluteUrl("/api/songs"),
            {
                allowCreateNew: properties.allowCreateNew,
                acceptSelection: properties.acceptSelection,
                createNewItem: properties.createNewItem,
				createCustomItem: properties.createCustomItem,
				createOptionFirstRow: (item: vdb.dataContracts.SongContract) => (item.name + " (" + item.songType + ")"),
				createOptionSecondRow: (item: vdb.dataContracts.SongContract) => (item.artistString),
				extraQueryParams: queryParams,
                filter: filter,
                height: properties.height,
				termParamName: 'query',
				method: 'GET'
            });


    }
}