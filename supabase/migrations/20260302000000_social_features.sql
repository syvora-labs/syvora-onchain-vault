-- ============================================================
-- Social Features: Likes, Comments, Follows
-- ============================================================

-- ------------------------------------------------------------
-- Post Likes
-- ------------------------------------------------------------
CREATE TABLE post_likes (
    post_id     UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post likes viewable by all"
    ON post_likes FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can like"
    ON post_likes FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes"
    ON post_likes FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Post Comments
-- ------------------------------------------------------------
CREATE TABLE post_comments (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id     UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content     TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post comments viewable by all"
    ON post_comments FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can comment"
    ON post_comments FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
    ON post_comments FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Follows
-- ------------------------------------------------------------
CREATE TABLE follows (
    follower_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    following_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows viewable by all"
    ON follows FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can follow"
    ON follows FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
    ON follows FOR DELETE TO authenticated
    USING (auth.uid() = follower_id);
