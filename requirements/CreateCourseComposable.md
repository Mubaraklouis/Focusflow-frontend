Description: 

I Have created a composable that handles the creation of a course
I want you to create a reactive Form to bind all the course creation inputs and us that form to make api react to the nuxt server at api/courses to create a new course the nuxt api endpoint i will create it latter and also v-bind all the course input to the form and make a post request to the nuxt server at api/courses to create a new course

it will be like this latter 

get all course => index.get.tst
Create course => course.post.ts

accepted datastructure from the backend is 


{
    "course_title": " Gang:  & GORM",
    "course_thumb": "https://images.example.com/go-course.png",
    "course_category_id": 1,
    "user_id": 440,
    "course_visibility": "public"
}


Fix 1:

Within Create course can you retrive the user id from the cookies and pass it to the create course request 


Feature addons :1

I have updated my backend to handle file upload and the file should be pass like this
course_thumb
I want you to modify the create course composable to be able to upload the thamnail to the backend so that i can be save to s3 backet 




