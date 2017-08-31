import { Component, OnInit } from '@angular/core';
import { HttpServiceService } from '../http-service.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register-newsfeed',
  templateUrl: './register-newsfeed.component.html',
  styleUrls: ['./register-newsfeed.component.css']
})
export class RegisterNewsfeedComponent implements OnInit {

  newsfeed_nickname = "";
  newsfeed_avatar_image = "";
  newsfeed_source = "";
  newsfeed_main_image = "";
  newsfeed_name = "";
  newsfeed_summary = "";
  newsfeed_story = [{"storyImage" : "", "storyVideo" : "", "storyContent" : ""}];

  constructor(
    public httpService: HttpServiceService,
    public router: Router
  ) { }

  ngOnInit() {
  }

  addStory() {
    this.newsfeed_story.push({"storyImage" : "", "storyVideo" : "", "storyContent" : ""});
  }

  removeStory() {
    this.newsfeed_story.pop();
  }

  uploadFiles(event, target) { 
    let fileList: FileList = event.target.files;
    if(fileList.length > 0) {
      let file: File = fileList[0];
      let formData: FormData = new FormData();
      formData.append('ex_filename', file);

      this.httpService.uploadFiles(formData)
      .subscribe(
        (data) => {
          if(data.success == true) {
            if(target == 'newsfeed_avatar_image') {
              this.newsfeed_avatar_image = data.data;
            }
            else if(target == 'newsfeed_main_image') {
              this.newsfeed_main_image = data.data;
            }
            else {
              this.newsfeed_story[target].storyImage = data.data;
            }
          }
          else if(data.success == false) {
            this.httpService.apiRequestErrorHandler(data)
            .then(() => {
              this.uploadFiles(event, target);
            })
          }
        },
        (err) => {
          console.log(err);
          alert('오류가 발생했습니다.');
        }
      );

    }
  } 

  moveFiles() {
    let images = [];
    if(this.newsfeed_avatar_image != "") {
      images.push(this.newsfeed_avatar_image);
    }
    if(this.newsfeed_main_image != "") {
      images.push(this.newsfeed_main_image);
    }
    for(let i=0; i<this.newsfeed_story.length; i++) {
      if(this.newsfeed_story[i].storyImage != "") {
        images.push(this.newsfeed_story[i].storyImage);
      }
    }
    this.httpService.moveFiles(images)
    .subscribe(
      (data) => {
        if(data.success == true) {
          this.newsfeed_avatar_image = this.newsfeed_avatar_image.replace('tmp', 'images');
          this.newsfeed_main_image = this.newsfeed_main_image.replace('tmp', 'images');
          for(let i=0; i<this.newsfeed_story.length; i++) {
            this.newsfeed_story[i].storyImage = this.newsfeed_story[i].storyImage.replace('tmp', 'images');
          }
          this.registerNewsfeed();
        }
        else if(data.success == false) {
          this.httpService.apiRequestErrorHandler(data)
          .then(() => {
            this.moveFiles();
          })
        }
      },
      (err) => {
        console.log(err);
        alert('오류가 발생했습니다.');
      }
    );

  }

  registerNewsfeed() {
    let newsfeedData = {
      "newsfeed_nickname" : this.newsfeed_nickname,
      "newsfeed_avatar_image" : this.newsfeed_avatar_image,
      "newsfeed_source" : this.newsfeed_source,
      "newsfeed_main_image" : this.newsfeed_main_image,
      "newsfeed_name" : this.newsfeed_name,
      "newsfeed_summary" : this.newsfeed_summary,
      "newsfeed_story" : this.newsfeed_story
    }
    this.httpService.registerNewsfeed(newsfeedData)
    .subscribe(
      (data) => {
        if(data.success == true) {
          alert('뉴스피드가 등록되었습니다.');
          this.router.navigate([ '/admin/home' ]);
        }
        else if(data.success == false) {
          this.httpService.apiRequestErrorHandler(data)
          .then(() => {
            this.registerNewsfeed();
          })
        }
      },
      (err) => {
        console.log(err);
        alert('오류가 발생했습니다.');
      }
    );
  }


}
