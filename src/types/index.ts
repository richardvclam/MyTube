export interface CommentThread {
  /** Etag of this resource. */
  etag?: string;
  /** The ID that YouTube uses to uniquely identify the comment thread. */
  id?: string;
  /** Identifies what kind of resource this is. Value: the fixed string "youtube#commentThread". */
  kind?: string;
  /** The replies object contains a limited number of replies (if any) to the top level comment found in the snippet. */
  replies?: CommentThreadReplies;
  /** The snippet object contains basic details about the comment thread and also the top level comment. */
  snippet?: CommentThreadSnippet;
}

export interface CommentThreadReplies {
  /**
   * A limited number of replies. Unless the number of replies returned equals total_reply_count in the snippet the returned replies are only a subset of
   * the total number of replies.
   */
  comments?: Comment[];
}

export interface CommentThreadSnippet {
  /** Whether the current viewer of the thread can reply to it. This is viewer specific - other viewers may see a different value for this field. */
  canReply?: boolean;
  /**
   * The YouTube channel the comments in the thread refer to or the channel with the video the comments refer to. If video_id isn't set the comments refer
   * to the channel itself.
   */
  channelId?: string;
  /** Whether the thread (and therefore all its comments) is visible to all YouTube users. */
  isPublic?: boolean;
  /** The top level comment of this thread. */
  topLevelComment?: Comment;
  /** The total number of replies (not including the top level comment). */
  totalReplyCount?: number;
  /** The ID of the video the comments refer to, if any. No video_id implies a channel discussion comment. */
  videoId?: string;
}

export interface Comment {
  /** Etag of this resource. */
  etag?: string;
  /** The ID that YouTube uses to uniquely identify the comment. */
  id?: string;
  /** Identifies what kind of resource this is. Value: the fixed string "youtube#comment". */
  kind?: string;
  /** The snippet object contains basic details about the comment. */
  snippet?: CommentSnippet;
}

export interface CommentSnippet {
  /** The id of the author's YouTube channel, if any. */
  authorChannelId?: any;
  /** Link to the author's YouTube channel, if any. */
  authorChannelUrl?: string;
  /** The name of the user who posted the comment. */
  authorDisplayName?: string;
  /** The URL for the avatar of the user who posted the comment. */
  authorProfileImageUrl?: string;
  /** Whether the current viewer can rate this comment. */
  canRate?: boolean;
  /**
   * The id of the corresponding YouTube channel. In case of a channel comment this is the channel the comment refers to. In case of a video comment it's
   * the video's channel.
   */
  channelId?: string;
  /** The total number of likes this comment has received. */
  likeCount?: number;
  /** The comment's moderation status. Will not be set if the comments were requested through the id filter. */
  moderationStatus?: string;
  /** The unique id of the parent comment, only set for replies. */
  parentId?: string;
  /** The date and time when the comment was orignally published. The value is specified in ISO 8601 (YYYY-MM-DDThh:mm:ss.sZ) format. */
  publishedAt?: string;
  /**
   * The comment's text. The format is either plain text or HTML dependent on what has been requested. Even the plain text representation may differ from
   * the text originally posted in that it may replace video links with video titles etc.
   */
  textDisplay?: string;
  /**
   * The comment's original raw text as initially posted or last updated. The original text will only be returned if it is accessible to the viewer, which
   * is only guaranteed if the viewer is the comment's author.
   */
  textOriginal?: string;
  /** The date and time when was last updated . The value is specified in ISO 8601 (YYYY-MM-DDThh:mm:ss.sZ) format. */
  updatedAt?: string;
  /** The ID of the video the comment refers to, if any. */
  videoId?: string;
  /**
   * The rating the viewer has given to this comment. For the time being this will never return RATE_TYPE_DISLIKE and instead return RATE_TYPE_NONE. This
   * may change in the future.
   */
  viewerRating?: string;
}
