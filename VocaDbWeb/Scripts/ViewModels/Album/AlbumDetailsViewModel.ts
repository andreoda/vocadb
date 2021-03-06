/// <reference path="../../typings/jquery/jquery.d.ts" />
/// <reference path="../../typings/knockout/knockout.d.ts" />
/// <reference path="../../Shared/GlobalFunctions.ts" />

module vdb.viewModels {

	import cls = vdb.models;
	import dc = dataContracts;
	import rep = repositories;

    export class AlbumDetailsViewModel {

		public comments: EditableCommentsViewModel;

        public downloadTagsDialog: DownloadTagsViewModel;

		private id: number;

		public reportViewModel: ReportEntryViewModel;

		public description: globalization.EnglishTranslatedStringViewModel;

		public personalDescription: SelfDescriptionViewModel;

		public reviewsViewModel: AlbumReviewsViewModel;

		public tagsEditViewModel: tags.TagsEditViewModel;

		public tagUsages: tags.TagListViewModel;

        public usersContent = ko.observable<string>();

        public getUsers = () => {

            $.post(vdb.functions.mapAbsoluteUrl("/Album/UsersWithAlbumInCollection"), { albumId: this.id }, result => {

                this.usersContent(result);
                $("#userCollectionsPopup").dialog("open");

            });

            return false;

        };

        constructor(
			repo: rep.AlbumRepository,
			userRepo: rep.UserRepository,
			artistRepository: rep.ArtistRepository,
			data: AlbumDetailsAjax,
			reportTypes: IEntryReportType[],
			loggedUserId: number,
			languagePreference: models.globalization.ContentLanguagePreference,
			canDeleteAllComments: boolean,
			formatString: string,
			showTranslatedDescription: boolean) {

			this.id = data.id;
            this.downloadTagsDialog = new DownloadTagsViewModel(this.id, formatString);
			this.description = new globalization.EnglishTranslatedStringViewModel(showTranslatedDescription);
			this.comments = new EditableCommentsViewModel(repo, this.id, loggedUserId, canDeleteAllComments, canDeleteAllComments, false, data.latestComments, true);

			this.personalDescription = new SelfDescriptionViewModel(data.personalDescriptionAuthor, data.personalDescriptionText, artistRepository, callback => {
				repo.getOneWithComponents(this.id, 'Artists', cls.globalization.ContentLanguagePreference[languagePreference], result => {
					var artists = _.chain(result.artists)
						.filter(helpers.ArtistHelper.isValidForPersonalDescription)
						.map(a => a.artist).value();
					callback(artists);
				});
			}, vm => repo.updatePersonalDescription(this.id, vm.text(), vm.author.entry()));

			this.tagsEditViewModel = new tags.TagsEditViewModel({
				getTagSelections: callback => userRepo.getAlbumTagSelections(this.id, callback),
				saveTagSelections: tags => userRepo.updateAlbumTags(this.id, tags, this.tagUsages.updateTagUsages)
			}, cls.EntryType.Album, callback => repo.getTagSuggestions(this.id, callback));

			this.tagUsages = new tags.TagListViewModel(data.tagUsages);

			this.reportViewModel = new ReportEntryViewModel(reportTypes, (reportType, notes) => {

				repo.createReport(this.id, reportType, notes, null);

				vdb.ui.showSuccessMessage(vdb.resources.shared.reportSent);

			});

			this.reviewsViewModel = new AlbumReviewsViewModel(repo, this.id, canDeleteAllComments, canDeleteAllComments, loggedUserId);

        }

    }

    export interface AlbumDetailsAjax {

        id: number;
		latestComments: dc.CommentContract[];
		personalDescriptionText?: string;
		personalDescriptionAuthor?: dc.ArtistApiContract;
		tagUsages: dc.tags.TagUsageForApiContract[];

    }

    export class DownloadTagsViewModel {

        public dialogVisible = ko.observable(false);

        public downloadTags = () => {

            this.dialogVisible(false);

            var url = "/Album/DownloadTags/" + this.albumId;
            window.location.href = url + "?setFormatString=true&formatString=" + encodeURIComponent(this.formatString());

        };

        public formatString: KnockoutObservable<string>;

        public dialogButtons = ko.observableArray([
            { text: vdb.resources.albumDetails.download, click: this.downloadTags },
        ]);

        public show = () => {

            this.dialogVisible(true);

        };

        constructor(private albumId: number, formatString: string) {
            this.formatString = ko.observable(formatString)
        }

	}

	export class AlbumReviewsViewModel {

		constructor(
			private readonly albumRepository: rep.AlbumRepository,
			private readonly albumId: number,
			private readonly canDeleteAllComments: boolean,
			private readonly canEditAllComments: boolean,
			private readonly loggedUserId?: number) {

		}

		public beginEditReview = (review: AlbumReviewViewModel) => {

			review.beginEdit();
			this.editReviewModel(review);

		}

		public cancelEditReview = () => {
			this.editReviewModel(null);
		}

		private canDeleteReview = (comment: dc.albums.AlbumReviewContract) => {
			// If one can edit they can also delete
			return (this.canDeleteAllComments || this.canEditAllComments || (comment.user && comment.user.id === this.loggedUserId));
		}

		private canEditReview = (comment: dc.albums.AlbumReviewContract) => {
			return (this.canEditAllComments || (comment.user && comment.user.id === this.loggedUserId));
		}

		public async createNewReview() {
			const contract = {
				date: new Date().toLocaleDateString(),
				languageCode: this.languageCode(),
				text: this.newReviewText(),
				title: this.newReviewTitle(),
				user: { id: this.loggedUserId }
			};
			this.newReviewText("");
			this.newReviewTitle("");
			this.showCreateNewReview(false);
			this.languageCode("");
			const result = await this.albumRepository.createOrUpdateReview(this.albumId, contract);
			this.reviews.push(new AlbumReviewViewModel(result, this.canDeleteReview(result), this.canEditReview(result)));
		}

		public deleteReview = (review: AlbumReviewViewModel) => {

			this.reviews.remove(review);

			this.albumRepository.deleteReview(this.albumId, review.id);

		}

		public getRatingForUser(userId: number): number {
			return _.chain(this.userRatings())
				.filter(rating => rating.user && rating.user.id === userId && rating.rating)
				.map(rating => rating.rating)
				.take(1)
				.value()
				[0];
		}

		public ratingStars(userRating: number) {

			var ratings = _.map([1, 2, 3, 4, 5], rating => { return { enabled: (Math.round(userRating) >= rating) } });
			return ratings;

		}

		public saveEditedReview = () => {

			if (!this.editReviewModel())
				return;

			this.editReviewModel().saveChanges();
			var editedContract = this.editReviewModel().toContract();

			this.albumRepository.createOrUpdateReview(this.albumId, editedContract);

			this.editReviewModel(null);

		}

		public async loadReviews() {
			const [reviews, ratings] = await Promise.all([this.albumRepository.getReviews(this.albumId), this.albumRepository.getUserCollections(this.albumId)]);
			const reviewViewModels = _.map(reviews, review => new AlbumReviewViewModel(review, this.canDeleteReview(review), this.canEditReview(review)));
			this.reviews(reviewViewModels);
			this.userRatings(ratings);
		}

		public editReviewModel = ko.observable<AlbumReviewViewModel>(null);

		public languageCode = ko.observable("");

		public newReviewText = ko.observable("");

		public newReviewTitle = ko.observable("");

		public reviews = ko.observableArray<AlbumReviewViewModel>();

		public showCreateNewReview = ko.observable(false);

		public writeReview = ko.observable(false);

		public reviewAlreadySubmitted = ko.computed(() => {
			return _.some(this.reviews(), review => review.user.id === this.loggedUserId && review.languageCode() === this.languageCode());
		});

		private userRatings = ko.observableArray<dc.AlbumForUserForApiContract>();

	}

	export class AlbumReviewViewModel {

		constructor(contract: dc.albums.AlbumReviewContract, public canBeDeleted: boolean, public canBeEdited: boolean) {
			this.date = new Date(contract.date);
			this.id = contract.id;
			this.languageCode = ko.observable(contract.languageCode);
			this.text = ko.observable(contract.text);
			this.title = ko.observable(contract.title);
			this.user = contract.user;
		}

		public beginEdit = () => {
			this.editedTitle(this.title());
			this.editedText(this.text());
		}

		public saveChanges = () => {
			this.text(this.editedText());
			this.title(this.editedTitle());
		}

		public toContract: () => dc.albums.AlbumReviewContract = () => {
			return { date: this.date.toISOString(), id: this.id, languageCode: this.languageCode(), text: this.text(), title: this.title(), user: this.user };
		}

		public date: Date;

		public editedTitle = ko.observable("");

		public editedText = ko.observable("");

		public id?: number;

		public languageCode: KnockoutObservable<string>;

		public text: KnockoutObservable<string>;

		public title: KnockoutObservable<string>;

		public user: dc.user.UserApiContract;

	}

}