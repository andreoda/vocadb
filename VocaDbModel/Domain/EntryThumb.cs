﻿using VocaDb.Model.Domain.Images;

namespace VocaDb.Model.Domain {

	public class EntryThumb : IEntryImageInformation {

		public static EntryThumb Create<T>(T entry) where T : class, IEntryBase, IEntryImageInformation {
			return !string.IsNullOrEmpty(entry?.Mime) ? new EntryThumb(entry, entry.Mime) : null;
		}

		private IEntryBase entry;

		public EntryThumb() {}

		public EntryThumb(IEntryBase entry, string mime) {
			Entry = entry;
			Mime = mime;
		}

		public IEntryBase Entry {
			get => entry;
			set {
				ParamIs.NotNull(() => value);
				entry = value;
			}
		}

		public EntryType EntryType => Entry.EntryType;

		public int Id => Entry.Id;

		public string Mime { get; set; }

		public override string ToString() {
			return string.Format("Thumbnail for {0}.", Entry);
		}

		public int Version => Entry.Version;

	}
}
