/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../DataContracts/User/UserMessageSummaryContract.ts" />
/// <reference path="../Models/SongVoteRating.ts" />

module vdb.repositories {

    import cls = vdb.models;
    import dc = vdb.dataContracts;

    // Repository for managing users and related objects.
    // Corresponds to the UserController class.
	export class UserRepository implements ICommentRepository {

		public addFollowedTag = (tagId: number, callback?: () => void) => {
			$.post(this.urlMapper.mapRelative("/api/users/current/followedTags/" + tagId), callback);
		}

		public createArtistSubscription = (artistId: number, callback?: () => void) => {

			$.post(this.mapUrl("/AddArtistForUser"), { artistId: artistId }, callback);

		};

		public createComment = (userId: number, contract: dc.CommentContract, callback: (contract: dc.CommentContract) => void) => {

			$.post(this.urlMapper.mapRelative("/api/users/" + userId + "/profileComments"), contract, callback, 'json');

		}

		public createMessage = (userId: number, contract: dc.user.UserApiContract, callback: (result: dc.UserMessageSummaryContract) => void) => {

			return $.post(this.urlMapper.mapRelative("/api/users/" + userId + "/messages"), contract, callback, 'json');
			
		}

		public deleteArtistSubscription = (artistId: number, callback?: () => void) => {

			$.post(this.mapUrl("/RemoveArtistFromUser"), { artistId: artistId }, callback);

		}

		public deleteComment = (commentId: number, callback: () => void) => {
			
			$.ajax(this.urlMapper.mapRelative("/api/users/profileComments/" + commentId), { type: 'DELETE', success: callback });

		}

		public deleteEventForUser = (eventId: number, callback?: () => void) => {

			var url = this.urlMapper.mapRelative("/api/users/current/events/" + eventId);
			return $.ajax(url, { type: 'DELETE', success: callback }) as JQueryPromise<{}>;

		}

		public deleteFollowedTag = (tagId: number, callback?: () => void) => {
			$.ajax(this.urlMapper.mapRelative("/api/users/current/followedTags/" + tagId), { type: 'DELETE', success: callback });
		}

		public deleteMessage = (messageId: number) => {

            var url = this.urlMapper.mapRelative("/User/DeleteMessage");
            $.post(url, { messageId: messageId });

		}

		public deleteMessages = (userId: number, messageIds: number[]) => {
			
            var url = this.urlMapper.mapRelative("/api/users/" + userId + "/messages");
			helpers.AjaxHelper.deleteJSON_Url(url, "messageId", messageIds);

		}

		public getAlbumCollectionList = (
			userId: number,
			paging: dc.PagingProperties, lang: string, query: string,
			tag: number,
			albumType: string,
			artistId: number,
			purchaseStatuses: string,
			releaseEventId: number,
			advancedFilters: viewModels.search.AdvancedSearchFilter[],
			sort: string,
			callback) => {

			var url = this.urlMapper.mapRelative("/api/users/" + userId + "/albums");
			var data = {
				start: paging.start, getTotalCount: paging.getTotalCount, maxResults: paging.maxEntries,
				query: query,
				tagId: tag,
				albumTypes: albumType,
				artistId: artistId,
				purchaseStatuses: purchaseStatuses,
				releaseEventId: releaseEventId || undefined,
				fields: "AdditionalNames,MainPicture",
				lang: lang,
				nameMatchMode: 'Auto',
				sort: sort,
				advancedFilters: advancedFilters
			};

			$.getJSON(url, data, callback);

		}

		public getComments = (userId: number, callback) => {

			var url = this.urlMapper.mapRelative("/api/users/" + userId + "/profileComments");
			var data = {
				start: 0, getTotalCount: false, maxResults: 300,
				userId: userId
			};

			$.getJSON(url, data, result => callback(result.items));

		};

		public getEvents = (userId: number, relationshipType: cls.users.UserEventRelationshipType, callback: (result: dc.ReleaseEventContract[]) => void) => {

			var url = this.urlMapper.mapRelative("/api/users/" + userId + "/events");
			$.getJSON(url, { relationshipType: relationshipType }, callback);

		}

		public getFollowedArtistsList = (
			userId: number,
			paging: dc.PagingProperties, lang: string,
			artistType: string,
			callback) => {

			var url = this.urlMapper.mapRelative("/api/users/" + userId + "/followedArtists");
			var data = {
				start: paging.start, getTotalCount: paging.getTotalCount, maxResults: paging.maxEntries,
				fields: "AdditionalNames,MainPicture", lang: lang, nameMatchMode: 'Auto', artistType: artistType
			};

			$.getJSON(url, data, callback);

		}

		public getList = (
			paging: dc.PagingProperties,
			query: string,
			sort: string,
			groups: string,
			includeDisabled: boolean,
			onlyVerified: boolean,
			knowsLanguage: string,
			nameMatchMode: string,
			fields: string,
			callback: (result: dc.PartialFindResultContract<dc.user.UserApiContract>) => void) => {

			var url = this.urlMapper.mapRelative("/api/users");
			var data = {
				start: paging.start, getTotalCount: paging.getTotalCount, maxResults: paging.maxEntries,
				query: query, nameMatchMode: nameMatchMode, sort: sort,
				includeDisabled: includeDisabled,
				onlyVerified: onlyVerified,
				knowsLanguage: knowsLanguage,
				groups: groups || undefined,
				fields: fields || undefined
			};

			$.getJSON(url, data, callback);

		}

		public getOne = (id: number, fields: string, callback: (result: dc.user.UserApiContract) => void) => {
			var url = this.urlMapper.mapRelative("/api/users/" + id);
			$.getJSON(url, { fields: fields || undefined }, callback);
		}

		public getOneByName = (username: string, callback: (result: dc.user.UserApiContract) => void) => {
			this.getList({}, username, null, null, false, false, null, "Exact", null, result => {
				callback(result.items.length === 1 ? result.items[0] : null);
			});
		}

        public getMessage = (messageId: number, callback?: (result: dc.UserMessageSummaryContract) => void) => {

            var url = this.urlMapper.mapRelative("/api/users/messages/" + messageId);
            $.getJSON(url, callback);

        };

		public getMessageSummaries = (userId: number, inbox: UserInboxType, paging: dc.PagingProperties, unread: boolean = false,
			anotherUserId?: number,
			iconSize: number = 40,
			callback?: (result: dc.PartialFindResultContract<dc.UserMessageSummaryContract>) => void) => {

			var url = this.urlMapper.mapRelative("/api/users/" + (userId || this.loggedUserId) + "/messages");
			$.getJSON(url, { inbox: UserInboxType[inbox], start: paging.start, maxResults: paging.maxEntries, getTotalCount: paging.getTotalCount, unread: unread, anotherUserId: anotherUserId }, callback);

		};

		public getRatedSongsList = (
			userId: number,
			paging: dc.PagingProperties, lang: string, query: string,
			tagIds: number[],
			artistIds: number[],
			childVoicebanks: boolean,
			rating: string,
			songListId: number,
			advancedFilters: viewModels.search.AdvancedSearchFilter[],
			groupByRating: boolean,
			pvServices: string,
			fields: string,
			sort: string,
			callback: (result: dc.PartialFindResultContract<dc.RatedSongForUserForApiContract>) => void) => {

			var url = this.urlMapper.mapRelative("/api/users/" + userId + "/ratedSongs");
			var data = {
				start: paging.start, getTotalCount: paging.getTotalCount, maxResults: paging.maxEntries,
				query: query, tagId: tagIds,
				artistId: artistIds,
				childVoicebanks: childVoicebanks,
				rating: rating,
				songListId: songListId,
				advancedFilters: advancedFilters,
				groupByRating: groupByRating,
				pvServices: pvServices,
				fields: fields, lang: lang, nameMatchMode: 'Auto', sort: sort
			};

			$.getJSON(url, data, callback);

		}

		public getRatingsByGenre = (userId: number, callback: (points: vdb.helpers.Tuple2<string, number>[]) => void) => {
	    
			var url = this.urlMapper.mapRelative('/api/users/' + userId + '/songs-per-genre/');
			$.getJSON(url, data => {
				callback(data);
			});

		}

		public getSongLists = (userId: number, query: string, paging: dc.PagingProperties, sort: string, fields: string,
			callback: (result: dc.PartialFindResultContract<dc.SongListContract>) => void) => {
	    
			var url = this.urlMapper.mapRelative("/api/users/" + userId + "/songLists");
			$.getJSON(url, {
				query: query,
				start: paging.start, getTotalCount: paging.getTotalCount, maxResults: paging.maxEntries,
				sort: sort,
				fields: fields
			}, callback);

		}

		// Gets a specific user's rating for a specific song.
		// userId: User ID. Can be null, in which case the logged user will be used (if any).
		// songId: ID of the song for which to get the rating. Cannot be null.
		// callback: Callback receiving the rating. If the user has not rated the song, or if the user is not logged in, this will be "Nothing".
		public getSongRating = (userId: number, songId: number, callback: (rating: string) => void) => {

			userId = userId || this.loggedUserId;

			if (!userId) {
				callback('Nothing');
				return;				
			}

			var url = this.urlMapper.mapRelative("/api/users/" + userId + "/ratedSongs/" + songId);
			$.getJSON(url, callback);

		}

        public getAlbumTagSelections = (albumId: number, callback: (tags: dc.tags.TagSelectionContract[]) => void) => {

			$.getJSON(this.urlMapper.mapRelative("/api/users/current/albumTags/" + albumId), callback);

        }

        public getArtistTagSelections = (artistId: number, callback: (tags: dc.tags.TagSelectionContract[]) => void) => {

			$.getJSON(this.urlMapper.mapRelative("/api/users/current/artistTags/" + artistId), callback);

        }

		public getEventTagSelections = (eventId: number, callback: (tags: dc.tags.TagSelectionContract[]) => void) => {

			$.getJSON(this.urlMapper.mapRelative("/api/users/current/eventTags/" + eventId), callback);

		}

		public getEventSeriesTagSelections = (seriesId: number, callback: (tags: dc.tags.TagSelectionContract[]) => void) => {

			$.getJSON(this.urlMapper.mapRelative("/api/users/current/eventSeriesTags/" + seriesId), callback);

		}

        public getSongTagSelections = (songId: number, callback: (tags: dc.tags.TagSelectionContract[]) => void) => {

			$.getJSON(this.urlMapper.mapRelative("/api/users/current/songTags/" + songId), callback);

        }

		public refreshEntryEdit = (entryType: models.EntryType, entryId: number) => {
			$.post(this.urlMapper.mapRelative("/api/users/current/refreshEntryEdit/?entryType=" + models.EntryType[entryType] + "&entryId=" + entryId));
		}

		public requestEmailVerification = (callback?: () => void) => {

			var url = this.mapUrl("/RequestEmailVerification");
			$.post(url, callback);

		};

        public updateAlbumTags = (albumId: number, tags: dc.TagBaseContract[], callback: (usages: dc.tags.TagUsageForApiContract[]) => void) => {

			helpers.AjaxHelper.putJSON(this.urlMapper.mapRelative("/api/users/current/albumTags/" + albumId), tags, callback);

        }

		// Updates artist subscription settings for an artist followed by a user.
		public updateArtistSubscription = (artistId: number, emailNotifications?: boolean, siteNotifications?: boolean) => {

			$.post(this.mapUrl("/UpdateArtistSubscription"), {
				artistId: artistId, emailNotifications: emailNotifications, siteNotifications: siteNotifications
			});

		};

        public updateArtistTags = (artistId: number, tags: dc.TagBaseContract[], callback: (usages: dc.tags.TagUsageForApiContract[]) => void) => {

			helpers.AjaxHelper.putJSON(this.urlMapper.mapRelative("/api/users/current/artistTags/" + artistId), tags, callback);

        }

		public updateComment = (commentId: number, contract: dc.CommentContract, callback?: () => void) => {

			$.post(this.urlMapper.mapRelative("/api/users/profileComments/" + commentId), contract, callback, 'json');

		}

		public updateEventForUser = (eventId: number, associationType: vdb.models.users.UserEventRelationshipType, callback?: () => void) => {

			var url = this.urlMapper.mapRelative("/api/users/current/events/" + eventId);
			return $.post(url, { associationType: vdb.models.users.UserEventRelationshipType[associationType] }, callback) as JQueryPromise<{}>;

		}

		public updateEventTags = (eventId: number, tags: dc.TagBaseContract[], callback: (usages: dc.tags.TagUsageForApiContract[]) => void) => {
			helpers.AjaxHelper.putJSON(this.urlMapper.mapRelative("/api/users/current/eventTags/" + eventId), tags, callback);
		}

		public updateEventSeriesTags = (seriesId: number, tags: dc.TagBaseContract[], callback: (usages: dc.tags.TagUsageForApiContract[]) => void) => {
			helpers.AjaxHelper.putJSON(this.urlMapper.mapRelative("/api/users/current/eventSeriesTags/" + seriesId), tags, callback);
		}

        // Updates rating score for a song.
        // songId: Id of the song to be updated.
        // rating: Song rating.
        // callback: Callback function to be executed when the operation is complete.
        public updateSongRating = (songId: number, rating: vdb.models.SongVoteRating, callback: () => void) => {

			var url = this.urlMapper.mapRelative("/api/songs/" + songId + "/ratings");
			return $.post(url, { rating: vdb.models.SongVoteRating[rating] }, callback) as JQueryPromise<any>;

        }

        public updateSongTags = (songId: number, tags: dc.TagBaseContract[], callback: (usages: dc.tags.TagUsageForApiContract[]) => void) => {

			helpers.AjaxHelper.putJSON(this.urlMapper.mapRelative("/api/users/current/songTags/" + songId), tags, callback);
			 
        }

		// Updates user setting.
		// userId: user ID. Can be null in which case logged user ID (if any) will be used.
		// settingName: name of the setting to be updated, for example 'showChatBox'.
		// value: setting value, for example 'false'.
		public updateUserSetting = (userId: number, settingName: string, value: string, callback: () => void) => {
			
			var url = this.urlMapper.mapRelative("/api/users/" + (userId || this.loggedUserId) + "/settings/" + settingName);
			$.post(url, { '': value }, callback);

		}

        // Maps a relative URL to an absolute one.
        private mapUrl: (relative: string) => string;

        constructor(private urlMapper: vdb.UrlMapper, private loggedUserId?: number) {

            this.mapUrl = (relative: string) => {
                return urlMapper.mapRelative("/User") + relative;
            };

        }

    }
	
	export enum UserInboxType {
		Nothing,
		Received,
		Sent,
		Notifications			
	}

}