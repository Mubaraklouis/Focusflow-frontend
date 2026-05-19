Search for YouTube videos by query keyword

Use the search Youtube vidoe model to allow the user search for youtube vidoes 

The user should be able to select vidoes from the search results and click save or attach or add to course sothat those vidoes can be attached to that course 

I have the api implemented here is how it works 

complete_url: http://localhost:8080/api/courses/search?query=system design&max_results=10

example result is here 
{
  "message": "string",
  "query": "string",
  "results": [
    {
      "channel_name": "Tech Academy",
      "description": "A complete tutorial on Go",
      "published_at": "2026-01-15T10:00:00Z",
      "thumbnail_url": "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
      "title": "Learn Go Programming",
      "youtube_id": "dQw4w9WgXcQ"
    }
  ],
  "total_count": 0
}

use the server/api to do the api calls and make sure follow the conventions like register ,login and the rest of the api callls add documentation 

fr now implment only the search alone the rest we will implment step by step 
