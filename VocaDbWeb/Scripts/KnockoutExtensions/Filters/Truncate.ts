﻿
interface KnockoutFilters {
	truncate: (source: string, length: number) => string;
}

ko.filters.truncate = (source, length) => {
	return _.truncate(source, { 'length': length });
}