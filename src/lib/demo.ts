import type {Category,Product,Restaurant} from "./types";

export const demoRestaurant:Restaurant={
  id:"demo",name:"Bistro Nube",slug:"bistro-nube",
  description:"Una carta que flota entre sabores.",translations:{en:{description:"A menu floating among flavors."}},
  logo_url:null,cover_url:null,primary_color:"#7c3aed",secondary_color:"#ec4899",currency:"EUR",locale:"es-ES",is_published:true,language_switcher_enabled:true,
  phone:"+34 600 123 456",address:"Calle del Cielo, 12 · Madrid",email:"hola@bistronube.es",instagram_url:null,website_url:null,
};

const categoryData=[
  ["Entrantes","Starters"],
  ["Hamburguesas","Burgers"],
  ["Postres","Desserts"],
  ["Bebidas","Drinks"],
] as const;

export const demoCategories:Category[]=categoryData.map(([name,nameEn],i)=>({id:String(i),name,translations:{en:{name:nameEn}},slug:name.toLowerCase(),sort_order:i,is_active:true}));

export const demoProducts:Product[]=[
  {id:"1",category_id:"1",name:"Hamburguesa Nebulosa",description:"200g de carne madurada, queso cheddar derretido, cebolla caramelizada y nuestra salsa secreta en pan brioche de la casa.",translations:{en:{name:"Nebula Burger",description:"200g of aged beef, melted cheddar, caramelized onion and our secret sauce on house brioche."}},price_cents:1290,video_url:"https://res.cloudinary.com/det6jfwzx/video/upload/v1783700256/Generame_un_video_de_una_hambu_oo9gur.mp4",image_url:"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1400&q=85",is_available:true,is_featured:true,sort_order:0,categories:{name:"Hamburguesas",translations:{en:{name:"Burgers"}}}},
  {id:"2",category_id:"0",name:"Papas Voladoras",description:"Papas rústicas cortadas a mano, doble cocción, especias ahumadas y alioli de ajo negro.",translations:{en:{name:"Flying Potatoes",description:"Hand-cut rustic potatoes, twice cooked, with smoked spices and black garlic aioli."}},price_cents:650,video_url:"https://res.cloudinary.com/det6jfwzx/video/upload/v1783700440/id_papas_voladoras______nom_jqf6ng.mp4",image_url:"https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=1400&q=85",is_available:true,is_featured:false,sort_order:1,categories:{name:"Entrantes",translations:{en:{name:"Starters"}}}},
  {id:"3",category_id:"2",name:"Tarta de Queso Stratos",description:"Tarta de queso horneada al estilo San Sebastián, con un corazón ultra cremoso.",translations:{en:{name:"Stratos Cheesecake",description:"San Sebastián-style baked cheesecake with an ultra-creamy center."}},price_cents:550,video_url:"https://res.cloudinary.com/det6jfwzx/video/upload/v1783700598/id_tarta_queso_stratos__vnhgmf.mp4",image_url:"https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=1400&q=85",is_available:true,is_featured:false,sort_order:2,categories:{name:"Postres",translations:{en:{name:"Desserts"}}}},
  {id:"4",category_id:"3",name:"Limonada Flotante",description:"Zumo de limón natural, menta fresca, jengibre y sirope de agave con hielo picado.",translations:{en:{name:"Floating Lemonade",description:"Fresh lemon juice, mint, ginger and agave syrup over crushed ice."}},price_cents:390,video_url:null,image_url:"https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1400&q=85",is_available:true,is_featured:false,sort_order:3,categories:{name:"Bebidas",translations:{en:{name:"Drinks"}}}},
];
