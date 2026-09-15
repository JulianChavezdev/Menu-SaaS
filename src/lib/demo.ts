import type {Category,Product,Restaurant} from "./types";

export const demoRestaurant:Restaurant={
  id:"demo",name:"Bistro Nube",slug:"bistro-nube",subscription_status:"active",menu_template:"noirluxe",
  description:"Una carta demo compacta con nueve platos en vídeo.",translations:{en:{description:"A compact demo menu with nine dishes on video."}},
  logo_url:null,cover_url:null,primary_color:"#7c3aed",secondary_color:"#ec4899",currency:"EUR",locale:"es-ES",is_published:true,language_switcher_enabled:true,
  phone:"+34 600 123 456",address:"Calle del Cielo, 12 · Madrid",email:"hola@bistronube.es",instagram_url:null,website_url:null,
};

const categoryData=[
  {id:"1",name:"Hamburguesas",nameEn:"Burgers",slug:"hamburguesas"},
  {id:"2",name:"Carnes a la parrilla",nameEn:"Grilled meat",slug:"parrilla"},
  {id:"3",name:"Ensaladas",nameEn:"Salads",slug:"ensaladas"},
  {id:"4",name:"Sándwiches",nameEn:"Sandwiches",slug:"sandwiches"},
] as const;

export const demoCategories:Category[]=categoryData.map(({id,name,nameEn,slug},sort_order)=>({id,name,translations:{en:{name:nameEn}},slug,sort_order,is_active:true}));

type DemoProduct=Omit<Product,"categories"|"category_id"|"is_available"|"is_featured">&{categoryId:string;featured?:boolean};

function createDemoProduct(input:DemoProduct):Product{
  const category=demoCategories.find(item=>item.id===input.categoryId);
  if(!category)throw new Error(`Categoría demo desconocida: ${input.categoryId}`);
  const {categoryId,featured=false,...product}=input;
  return {...product,category_id:categoryId,is_available:true,is_featured:featured,categories:{name:category.name,translations:category.translations}};
}

export const demoProducts:Product[]=[
  createDemoProduct({id:"1",categoryId:"1",name:"Hamburguesa Clásica",description:"Carne a la parrilla, lechuga fresca y tomate en pan tostado.",translations:{en:{name:"Classic Burger",description:"Grilled beef, fresh lettuce and tomato on a toasted bun."}},price_cents:1290,video_url:"https://videos.pexels.com/video-files/8879540/8879540-hd_720_1366_25fps.mp4",image_url:"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=82",allergens:["gluten"],sort_order:0,featured:true}),
  createDemoProduct({id:"2",categoryId:"1",name:"Burger Mac & Cheese",description:"Hamburguesa montada al momento con macarrones con queso y salsa cremosa.",translations:{en:{name:"Mac & Cheese Burger",description:"Freshly assembled burger with macaroni cheese and creamy sauce."}},price_cents:1490,video_url:"https://videos.pexels.com/video-files/31707032/13509363_1080_1920_30fps.mp4",image_url:"https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=82",allergens:["gluten","eggs","milk"],sort_order:1}),
  createDemoProduct({id:"3",categoryId:"2",name:"Brochetas a la Parrilla",description:"Brochetas de carne jugosa doradas lentamente sobre la parrilla.",translations:{en:{name:"Grilled Meat Skewers",description:"Juicy meat skewers slowly browned over the grill."}},price_cents:1890,video_url:"https://videos.pexels.com/video-files/32383568/13812603_1080_1920_30fps.mp4",image_url:"https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=1200&q=82",sort_order:2}),
  createDemoProduct({id:"4",categoryId:"2",name:"Yakiniku Japonés",description:"Cortes de wagyu y cerdo cocinados al momento sobre brasas al estilo japonés.",translations:{en:{name:"Japanese Yakiniku",description:"Wagyu and pork cuts cooked tableside over charcoal in Japanese style."}},price_cents:2390,video_url:"https://videos.pexels.com/video-files/33338733/14196337_1080_1920_24fps.mp4",image_url:"https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=82",allergens:["soy"],sort_order:3}),
  createDemoProduct({id:"5",categoryId:"2",name:"Entrecot a la Parrilla",description:"Entrecot jugoso con marcado intenso, servido recién salido de la parrilla.",translations:{en:{name:"Grilled Entrecôte",description:"Juicy, deeply seared entrecôte served straight from the grill."}},price_cents:2690,video_url:"https://videos.pexels.com/video-files/35517037/15047359_2160_3840_25fps.mp4",image_url:"https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=1200&q=82",sort_order:4}),
  createDemoProduct({id:"6",categoryId:"3",name:"Ensalada del Huerto",description:"Verduras frescas, queso feta, crutones y aderezo servido al momento.",translations:{en:{name:"Garden Salad",description:"Fresh vegetables, feta, croutons and dressing served to order."}},price_cents:1190,video_url:"https://videos.pexels.com/video-files/31706999/13509359_1080_1920_30fps.mp4",image_url:"https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=82",allergens:["gluten","milk"],sort_order:5}),
  createDemoProduct({id:"7",categoryId:"3",name:"Ensalada Cítrica",description:"Ensalada vibrante de verduras y aceitunas terminada con lima recién exprimida.",translations:{en:{name:"Citrus Salad",description:"Vibrant vegetable and olive salad finished with freshly squeezed lime."}},price_cents:1250,video_url:"https://videos.pexels.com/video-files/37346969/15819055_1080_1920_30fps.mp4",image_url:"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=82",sort_order:6}),
  createDemoProduct({id:"8",categoryId:"3",name:"Bowl Mediterráneo",description:"Ensalada preparada en bol con vegetales variados, pan y aderezo de hierbas.",translations:{en:{name:"Mediterranean Bowl",description:"Bowl salad with mixed vegetables, bread and herb dressing."}},price_cents:1290,video_url:"https://videos.pexels.com/video-files/27914453/12261604_1080_1920_30fps.mp4",image_url:"https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=1200&q=82",allergens:["gluten"],sort_order:7}),
  createDemoProduct({id:"9",categoryId:"4",name:"Sándwich Tostado",description:"Sándwich de pan dorado preparado y servido caliente.",translations:{en:{name:"Toasted Sandwich",description:"Golden toasted sandwich prepared and served hot."}},price_cents:1090,video_url:"https://videos.pexels.com/video-files/19121680/19121680-hd_1080_1920_30fps.mp4",image_url:"https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=82",allergens:["gluten","milk"],sort_order:8}),
];
