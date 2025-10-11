Based on the provided source code, here is the documentation for the API endpoints.

All endpoints are prefixed with `/api`.

### Authentication (`/api/auth`)

Handles user registration, login, and session management.

| Method | Endpoint | Authentication | Description | Request Body | Success Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/register` | None | Creates a new user account. | `{ "email", "password", "name" }` | `201 Created` with `{ "user": { "id", "email", "name", "role" }, "token" }` |
| `POST` | `/login` | None | Logs in an existing user. | `{ "email", "password" }` | `200 OK` with `{ "user": { "id", "email", "name", "role" }, "token" }` |
| `POST` | `/logout` | Required | Logs out the currently authenticated user. | (None) | `200 OK` with `{ "message": "Logged out successfully" }` |
| `GET` | `/me` | Required | Retrieves the profile of the authenticated user. | (None) | `200 OK` with `{ "user": { "id", "email", "name", "role" } }` |

---

### Articles (`/api/articles`)

Endpoints for managing and retrieving articles.

| Method | Endpoint | Authentication | Description | Request Body / Query Params | Success Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Optional | Lists articles. Only shows `PUBLISHED` articles for non-admins. | *Query*: `page`, `limit`, `search`, `status`, `isPremium`, `tag` | `200 OK` with a paginated list of articles. |
| `GET` | `/:slug` | Optional | Retrieves a single article by its slug. Premium content is locked if not purchased. | (None) | `200 OK` with the article object. |
| `POST` | `/` | **Admin** | Creates a new article. | `{ "title", "content", "tags", ... }` | `201 Created` with the new article object. |
| `PUT` | `/:id` | **Admin** | Updates an article by its ID. | `{ "title", "content", "tags", ... }` | `200 OK` with the updated article object. |
| `DELETE` | `/:id` | **Admin** | Deletes an article by its ID. | (None) | `200 OK` with `{ "message": "Article deleted successfully" }` |
| `PATCH`|`/:id/status`| **Admin** | Updates an article's status (`DRAFT`, `STAGING`, `PUBLISHED`). | `{ "status": "PUBLISHED" }` | `200 OK` with the updated article object. |
| `POST` |`/:articleId/media`| **Admin** | Uploads a media file (image/video) for an article. | `multipart/form-data` with `file` field | `201 Created` with the media object. |
| `GET` |`/:id/media`| None | Retrieves all media for a specific article. | (None) | `200 OK` with an array of media objects. |

---

### Profile (`/api/profile`)

Endpoints for managing the authenticated user's profile, bookmarks, and purchases.

| Method | Endpoint | Authentication | Description | Request Body / Query Params | Success Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Required | Retrieves the current user's profile. | (None) | `200 OK` with user object. |
| `PUT` | `/` | Required | Updates the current user's profile. | `{ "name", "email", "password" }` (all optional) | `200 OK` with the updated user object. |
| `GET` | `/bookmarks` | Required | Lists the user's bookmarked articles. | *Query*: `page`, `limit` | `200 OK` with a paginated list of bookmarked articles. |
| `POST` | `/bookmarks/:articleId` | Required | Adds an article to the user's bookmarks. | (None) | `201 Created` with the bookmark object. |
| `DELETE`| `/bookmarks/:articleId` | Required | Removes an article from the user's bookmarks. | (None) | `200 OK` with `{ "message": "Bookmark removed successfully" }` |
| `GET` | `/purchases` | Required | Lists the user's purchased articles. | *Query*: `page`, `limit` | `200 OK` with a paginated list of purchases. |

---

### Payments (`/api/payments`)

Handles payment processing via Stripe for premium articles.

| Method | Endpoint | Authentication | Description | Request Body | Success Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/create-intent` | Required | Creates a Stripe Payment Intent for an article purchase. | `{ "articleId" }` | `200 OK` with `{ "clientSecret", "paymentIntentId" }` |
| `POST` | `/confirm` | Required | Confirms a successful payment and updates the purchase status. | `{ "paymentIntentId" }` | `200 OK` with `{ "success": true, "purchase": { ... } }` |
| `GET` | `/history` | Required | Retrieves the user's payment history. | (None) | `200 OK` with a paginated list of payments. |
| `POST` | `/webhook` | None | Endpoint for receiving Stripe webhook events. | Stripe event object | `200 OK` with `{ "received": true }` |

---

### Comments (`/api/comments`)

Endpoints for managing comments on articles.

| Method | Endpoint | Authentication | Description | Request Body | Success Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET`| `/article/:articleId` | Optional | Retrieves comments for an article. Non-admins see only approved comments. | (None) | `200 OK` with a paginated list of comments. |
| `POST`| `/article/:articleId` | Optional | Creates a new comment or a reply to an existing comment. | `{ "content", "parentId"? }` | `201 Created` with the new comment object. |
| `DELETE`| `/:id` | Required | Deletes a comment. (Requires ownership or admin role). | (None) | `200 OK` with `{ "message": "Comment deleted successfully" }` |
| `POST`| `/:id/like` | Optional | Toggles a like on a comment. | (None) | `200 OK` with `{ "liked": boolean, "likes": number }` |
| `GET`| `/all` | **Admin** | Retrieves all comments for moderation. | *Query*: `approved`, `page`, `limit` | `200 OK` with a paginated list of all comments. |
| `POST`| `/:id/approve` | **Admin** | Approves a pending comment. | (None) | `200 OK` with the updated comment object. |

---

### Reactions & Sharing (`/api/reactions`)

Endpoints for user engagement like likes, reactions, and shares.

| Method | Endpoint | Authentication | Description | Request Body | Success Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/article/:articleId/like` | Optional | Toggles a like on an article. | (None) | `200 OK` with `{ "liked": boolean, "likes": number }` |
| `POST` | `/article/:articleId/react` | Optional | Adds or removes a specific reaction from an article. | `{ "type": "LIKE" | "LOVE" | ... }` | `200 OK` with `{ "reacted": boolean, "type": "..." }` |
| `GET` | `/article/:articleId/reactions`| None | Retrieves the counts of each reaction type for an article. | (None) | `200 OK` with `{ "LIKE": 10, "LOVE": 5, ... }` |
| `POST` | `/article/:articleId/share` | Optional | Records a share event for an article on a specific platform. | `{ "platform": "TWITTER" | ... }` | `200 OK` with `{ "message": "Share recorded" }` |

---

### Collections (`/api/collections`)

Endpoints for managing article collections.

| Method | Endpoint | Authentication | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | None | Lists all collections. |
| `GET` | `/:slug` | None | Retrieves a single collection by its slug, including its articles. |
| `POST` | `/` | **Admin** | Creates a new collection. |
| `PUT` | `/:id` | **Admin** | Updates an existing collection. |
| `DELETE` | `/:id` | **Admin** | Deletes a collection. |
| `POST` | `/:collectionId/articles/:articleId` | **Admin** | Adds an article to a collection. |

---

### Search (`/api/search`)

Endpoints for searching and discovering articles.

| Method | Endpoint | Authentication | Description | Query Params | Success Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Optional | Performs an advanced search for articles. | `query`, `tags`, `author`, `isPremium`, `sortBy`, etc. | `200 OK` with `{ "articles", "pagination", "filters" }` |
| `GET` | `/popular` | None | Retrieves a list of the most popular search terms. | `limit` | `200 OK` with `{ "searches": [...] }` |
| `GET` | `/suggestions` | None | Provides search suggestions based on a partial query. | `q` (query string) | `200 OK` with `{ "articles": [...], "tags": [...] }` |

---

### Admin (`/api/admin`)

Admin-only endpoints for site-wide management and statistics.

| Method | Endpoint | Authentication | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/stats` | **Admin** | Retrieves dashboard statistics (total articles, users, revenue, etc.). |
| `GET` | `/articles` | **Admin** | Lists all articles, filterable by status, for the admin panel. |
| `GET` | `/users` | **Admin** | Lists all registered users. |

---

### Other Endpoints

| Path Prefix | Description | Authentication |
| :--- | :--- | :--- |
| `/api/analytics` | Provides detailed analytics on revenue, readers, and content performance. | **Admin** |
| `/api/notifications`| Manages user notifications and email subscription settings. | Required |
| `/api/progress` | Tracks and retrieves user reading progress on articles. | Required |
| `/api/newsletter` | Manages newsletter subscriptions and campaigns. | Public & **Admin** |
| `/api/related` | Retrieves related articles based on content and tags. | Public |
| `/api/citations` | Manages article citations. | Public & **Admin** |
| `/api/versions` | Manages article version history. | **Admin** |
| `/api/pdf` | Handles PDF generation and downloads for articles. | Public & **Admin** |