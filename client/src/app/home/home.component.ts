import { Component, HostListener, Inject, NgModule, OnInit, ViewChild, ElementRef } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/platform-browser';
// import { WINDOW } from "../window.service";
import { DomSanitizer } from '@angular/platform-browser';
import { Ng2DeviceService } from 'ng2-device-detector';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css',
              './../../assets/css/navbar/navigation-clean.css',
              './../../assets/css/navbar/navigation-center-brand.css',
              './../../assets/css/navbar/navigation-pushy.css',
              './../../assets/css/navbar/navigation-block.css',
              './../../assets/css/hero/application-hero.css',
              './../../assets/css/hero/classic-cars-hero.css',
              './../../assets/css/hero/main-hero.css',
              './../../assets/css/hero/baby-carrier-hero.css',
              './../../assets/css/hero/freelancer-hero.css',
              './../../assets/css/hero/demo-select-hero.css',
              './../../assets/css/hero/single-product-hero.css',
              './../../assets/css/content-block/dual-content.css',
              './../../assets/css/content-block/triple-content.css',
              './../../assets/css/content-block/statistics.css',
              './../../assets/css/content-block/twitterfeed.css',
              './../../assets/css/content-block/testimonial.css',
              './../../assets/css/content-block/pricing-table.css',
              './../../assets/css/content-block/showcase.css',
              './../../assets/css/content-block/works.css',
              './../../assets/css/content-block/brands.css',
              './../../assets/css/content-block/features-icon.css',
              './../../assets/css/content-block/info-box.css',
              './../../assets/css/content-block/form-box.css',
              './../../assets/css/content-block/products.css',
              './../../assets/css/content-block/single-product.css',
              './../../assets/css/content-block/month-product.css',
              './../../assets/css/content-block/newsletter-form.css',
              './../../assets/css/content-block/promotion-content.css',
              './../../assets/css/content-block/video-box.css',
              './../../assets/css/content-block/team.css',
              './../../assets/css/content-block/instafeed.css',
              './../../assets/css/content-block/zig-zag.css',
              './../../assets/css/animate-horizontal.css',
              './../../assets/css/spacing-helper.css',
              './../../assets/css/basic.css',
              './../../assets/css/custom.css',
            ]
})

export class HomeComponent implements OnInit {
  @ViewChild('rocketIcon') elementRocket: ElementRef;
  @ViewChild('devideSection') elementDevideSection: ElementRef;

  lastScrollTop: number = 0;
  delta: number = 5;
  navbarHeight: number = 75;
  isNavDown: boolean = true;
  isNavUp: boolean = false;
  safeURL: any;
  videoURL: String = "./../../assets/video/space.mp4";
  appLogo: String = "./../../assets/img/app-logo-white.png";


  rocketStyle:any;

  isOpenSideMenu: boolean = false;
  isOverScroll: boolean = false;

  features = [
    {
      title: "원하는 고객으로부터\n리얼 피드백을!",
      content: "경험과 이해를 바탕으로 작성하는 피드백!\n매칭된 고객들이 서로 의견을 나누는 토론!\n고객이 프로젝트를 진행하며 겪은 경험을 종합한 심층 피드백!",
      phoneImg: "assets/img/phone-mokup-1.png",
      illust: "assets/illust/illust-1.png",
    },
    {
      title: "1:1 인터뷰를 통해 고객의\n심층적인 의견을 풍부하게 수집!",
      content: "고객과 자유롭게 이야기함으로써 감정이나 욕구, 태도 등을\n이끌어내 다양하고 풍부한 의견을 수집해 보세요!",
      phoneImg: "assets/img/phone-mokup-2.png",
      illust: "assets/illust/illust-2.png",
    },
    {
      title: "클릭 몇 번으로 모든 정보를\n보기 쉽게 정리하여 제공!",
      content: "고객 정보와 피드백 정보부터 NPS지수와 만족도 평가까지!\n다양한 정보들을 도식화하여 손쉽게 확인할 수 있습니다.",
      phoneImg: "assets/img/phone-mokup-3.png",
      illust: "assets/illust/illust-3.png",
    },
    {
      title: "서비스 소개 뿐만 아니라\nSNS 홍보까지!",
      content: "프로젝트의 스토리 등록 뿐만 아니라 FEED100의 네이버 블로그,\n페이스북 페이지, 카카오톡 등 SNS를 통해 서비스를 홍보해 드립니다!",
      phoneImg: "assets/img/phone-mokup-4.png",
      illust: "assets/illust/illust-4.png",
    }
  ]

  priceTable = [
    {
      period: 7,
      personnel: 30,
      feedback: 30,
      opinion: 870,
      interview: 30,
      report: 30,
      unsaledPrice: 50,
      price: 45
    }
  ]

  constructor(
    @Inject(DOCUMENT) private document: Document,
    // @Inject(WINDOW) private window,
    private elementRef: ElementRef,
    private deviceService: Ng2DeviceService
  ) {
    console.log(window.screen.width);
  }

  isDesktop() {
    return this.deviceService.isDesktop();
  }

  ngOnInit() {
  }

  ngAfterContentInit() {
  }

  openSideMenu() {
    if(this.isOpenSideMenu) {
      this.isOpenSideMenu = false;
    } else {
      this.isOpenSideMenu = true;
    }
  }

  // nav scroll function
  @HostListener("window:scroll", [])
  public onWindowScroll() {
    const offset = this.document.documentElement.scrollTop || this.document.body.scrollTop || 0;

    // Make sure they scroll more than delta
    if(Math.abs(this.lastScrollTop - offset) <= this.delta)
        return;

    // // If they scrolled down and are past the navbar, add class .nav-up.
    // // This is necessary so you never see what is "behind" the navbar.
    // if (offset > this.lastScrollTop && offset > 75) {
    //   // Scroll Down
    //   this.isNavUp = true;
    //   this.isNavDown = false;
    // } else {
    //   // Scroll Up
    //   if(offset + this.window.screen.height < document.documentElement.scrollHeight) {
    //     this.isNavUp = false;
    //     this.isNavDown = true;
    //   }
    // }

    this.lastScrollTop = offset;

    if(offset < 150) {
      document.querySelector(".navigation-clean")['style'].backgroundColor = 'transparent'; // 추가
      this.appLogo = "./../../assets/img/app-logo-white.png"
      this.isOverScroll = false;
    } else {
      document.querySelector(".navigation-clean")['style'].backgroundColor = '#ffffff'; // 추가
      this.appLogo = "./../../assets/img/app-logo-black.png"
      this.isOverScroll = true;
    }
  }
}
