// ==================== ДАННЫЕ НОМЕРОВ ====================

const roomsData = {
  vip: [
    {
      name: "Presidential Suite",
      price: 650,
      size: "120 м²",
      img: "/assets/images/VIProom1.png",
      description: "Роскошный номер с панорамным видом"
    },
    {
      name: "Royal Deluxe",
      price: 450,
      size: "85 м²",
      img: "/assets/images/VIProom2.png",
      description: "Элегантный номер с джакузи"
    },
    {
      name: "Ocean View",
      price: 380,
      size: "70 м²",
      img: "/assets/images/VIProom3.png",
      description: "Номер с видом на океан"
    }
  ],
  classic: [
    {
      name: "Superior Room",
      price: 220,
      size: "45 м²",
      img: "/assets/images/CLASSICroom1.png",
      description: "Комфортабельный классический номер"
    },
    {
      name: "Deluxe Room",
      price: 280,
      size: "55 м²",
      img: "/assets/images/CLASSICroom2.png",
      description: "Просторный номер с балконом"
    },
    {
      name: "Executive Room",
      price: 320,
      size: "60 м²",
      img: "/assets/images/CLASSICroom3.png",
      description: "Бизнес-номер с рабочим кабинетом"
    }
  ],
  cheap: [
    {
      name: "Standard Room",
      price: 140,
      size: "35 м²",
      img: "/assets/images/CHEAProom1.png",
      description: "Уютный номер эконом-класса"
    },
    {
      name: "Economy Room",
      price: 95,
      size: "30 м²",
      img: "/assets/images/CHEAProom2.png",
      description: "Бюджетный номер со всеми удобствами"
    },
    {
      name: "Single Room",
      price: 75,
      size: "25 м²",
      img: "/assets/images/CHEAProom3.png",
      description: "Компактный одноместный номер"
    }
  ]
};

// ==================== ДАННЫЕ ГОРОДОВ ====================

const citiesList = [
  { value: "Tashkent", label: "Tashkent" },
  { value: "Bukhara", label: "Bukhara" },
  { value: "Samarkand", label: "Samarkand" },
  { value: "Khiva", label: "Khiva" },
  { value: "Fergana", label: "Fergana" }
];

// ==================== КОНФИГУРАЦИЯ API ====================

const API_CONFIG = {
  baseURL: 'http://localhost:3000/api',
  endpoints: {
    register: '/auth/register',
    login: '/auth/login',
    profile: '/auth/profile',
    bookings: '/bookings',
    myBookings: '/bookings/my'
  }
};