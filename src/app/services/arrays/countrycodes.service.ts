import { Injectable } from '@angular/core';

export interface CountryCode {
  name: string;
  dial_code: string;
  code: string;
  price: number;
}

@Injectable({
  providedIn: 'root'
})
export class CountryCodesService {

  private countryCodes: CountryCode[] = [
    {name:'Portugal', dial_code:'+351', code:'PT', price:2.2},
    {name:'United Kingdom', dial_code:'+44', code:'GB', price:3.7},
    {name:'Spain', dial_code:'+34', code:'ES', price:4.5},
    {name:'United States', dial_code:'+1', code:'US', price:2},
    {name:'Afghanistan', dial_code:'+93', code:'AF', price:2.2},
    {name:'Albania', dial_code:'+355', code:'AL', price:9.56},
    {name:'Algeria', dial_code:'+213', code:'DZ', price:10.76},
    {name:'AmericanSamoa', dial_code:'+1 684', code:'AS', price:6.93},
    {name:'Andorra', dial_code:'+376', code:'AD', price:13},
    {name:'Angola', dial_code:'+244', code:'AO', price:10.12},
    {name:'Anguilla', dial_code:'+1 264', code:'AI', price:2.66},
    {name:'Antigua and Barbuda', dial_code:'+1268', code:'AG', price:2.41},
    {name:'Argentina', dial_code:'+54', code:'AR', price:5.88},
    {name:'Armenia', dial_code:'+374', code:'AM', price:11.04},
    {name:'Aruba', dial_code:'+297', code:'AW', price:8},
    {name:'Australia', dial_code:'+61', code:'AU', price:9.84},
    {name:'Austria', dial_code:'+43', code:'AT', price:7.9},
    {name:'Azerbaijan', dial_code:'+994', code:'AZ', price:18.72},
    {name:'Bahamas', dial_code:'+1 242', code:'BS', price:5.56},
    {name:'Bahrain', dial_code:'+973', code:'BH', price:4},
    {name:'Bangladesh', dial_code:'+880', code:'BD', price:4.78},
    {name:'Barbados', dial_code:'+1 246', code:'BB', price:4.64},
    {name:'Belarus', dial_code:'+375', code:'BY', price:15},
    {name:'Belgium', dial_code:'+32', code:'BE', price:11},
    {name:'Belize', dial_code:'+501', code:'BZ', price:3.2},
    {name:'Benin', dial_code:'+229', code:'BJ', price:4.77},
    {name:'Bermuda', dial_code:'+1 441', code:'BM', price:3.11},
    {name:'Bhutan', dial_code:'+975', code:'BT', price:9.16},
    {name:'Bolivia, Plurinational State of', dial_code:'+591', code:'BO', price:7.26},
    {name:'Bosnia and Herzegovina', dial_code:'+387', code:'BA', price:7.6},
    {name:'Botswana', dial_code:'+267', code:'BW', price:5.8},
    {name:'Brazil', dial_code:'+55', code:'BR', price:2.78},
    {name:'Brunei Darussalam', dial_code:'+673', code:'BN', price:2.4},
    {name:'Bulgaria', dial_code:'+359', code:'BG', price:12.68},
    {name:'Burkina Faso', dial_code:'+226', code:'BF', price:6.46},
    {name:'Burundi', dial_code:'+257', code:'BI', price:8.02},
    {name:'Cambodia', dial_code:'+855', code:'KH', price:8.84},
    {name:'Cameroon', dial_code:'+237', code:'CM', price:6.82},
    {name:'Canada', dial_code:'+1', code:'CA', price:3.4},
    {name:'Cape Verde', dial_code:'+238', code:'CV', price:10.8},
    {name:'Cayman Islands', dial_code:'+ 345', code:'KY', price:10},
    {name:'Central African Republic', dial_code:'+236', code:'CF', price:3.56},
    {name:'Chad', dial_code:'+235', code:'TD', price:6.4},
    {name:'Chile', dial_code:'+56', code:'CL', price:4.9},
    {name:'China', dial_code:'+86', code:'CN', price:5.2},
    {name:'Cocos (Keeling) Islands', dial_code:'+61', code:'CC', price:20},
    {name:'Colombia', dial_code:'+57', code:'CO', price:1.35},
    {name:'Congo, The Democratic Republic of the', dial_code:'+243', code:'CD', price:6.88},
    {name:'Cote d\'Ivoire', dial_code:'+225', code:'CI', price:7.5},
    {name:'Comoros', dial_code:'+269', code:'KM', price:4},
    {name:'Congo', dial_code:'+242', code:'CG', price:20},
    {name:'Cook Islands', dial_code:'+682', code:'CK', price:20},
    {name:'Costa Rica', dial_code:'+506', code:'CR', price:3.06},
    {name:'Croatia', dial_code:'+385', code:'HR', price:10.6},
    {name:'Cuba', dial_code:'+53', code:'CU', price:16.4},
    {name:'Cyprus', dial_code:'+537', code:'CY', price:11},
    {name:'Czech Republic', dial_code:'+420', code:'CZ', price:10.6},
    {name:'Denmark', dial_code:'+45', code:'DK', price:3.2},
    {name:'Djibouti', dial_code:'+253', code:'DJ', price:11.6},
    {name:'Dominica', dial_code:'+1 767', code:'DM', price:2.41},
    {name:'Dominican Republic', dial_code:'+1 849', code:'DO', price:4.8},
    {name:'Ecuador', dial_code:'+593', code:'EC', price:11.4},
    {name:'Egypt', dial_code:'+20', code:'EG', price:10.92},
    {name:'El Salvador', dial_code:'+503', code:'SV', price:4.56},
    {name:'Equatorial Guinea', dial_code:'+240', code:'GQ', price:4.4},
    {name:'Eritrea', dial_code:'+291', code:'ER', price:10},
    {name:'Estonia', dial_code:'+372', code:'EE', price:9.6},
    {name:'Ethiopia', dial_code:'+251', code:'ET', price:2.4},
    {name:'Faroe Islands', dial_code:'+298', code:'FO', price:26},
    {name:'Fiji', dial_code:'+679', code:'FJ', price:4},
    {name:'Finland', dial_code:'+358', code:'FI', price:10.6},
    {name:'France', dial_code:'+33', code:'FR', price:6.58},
    {name:'French Guiana', dial_code:'+594', code:'GF', price:20},
    {name:'French Polynesia', dial_code:'+689', code:'PF', price:20},
    {name:'Gabon', dial_code:'+241', code:'GA', price:5.2},
    {name:'Gambia', dial_code:'+220', code:'GM', price:2.68},
    {name:'Georgia', dial_code:'+995', code:'GE', price:14.4},
    {name:'Germany', dial_code:'+49', code:'DE', price:11.88},
    {name:'Ghana', dial_code:'+233', code:'GH', price:8},
    {name:'Gibraltar', dial_code:'+350', code:'GI', price:2.6},
    {name:'Greece', dial_code:'+30', code:'GR', price:7.7},
    {name:'Greenland', dial_code:'+299', code:'GL', price:2.6},
    {name:'Grenada', dial_code:'+1 473', code:'GD', price:2.41},
    {name:'Guadeloupe', dial_code:'+590', code:'GP', price:12.15},
    {name:'Guam', dial_code:'+1 671', code:'GU', price:20},
    {name:'Guatemala', dial_code:'+502', code:'GT', price:5.58},
    {name:'Guinea', dial_code:'+224', code:'GN', price:8.66},
    {name:'Guinea-Bissau', dial_code:'+245', code:'GW', price:6.66},
    {name:'Guyana', dial_code:'+595', code:'GY', price:6.3},
    {name:'Haiti', dial_code:'+509', code:'HT', price:4.8},
    {name:'Honduras', dial_code:'+504', code:'HN', price:4.28},
    {name:'Hong Kong', dial_code:'+852', code:'HK', price:4.5},
    {name:'Hungary', dial_code:'+36', code:'HU', price:11.86},
    {name:'Iceland', dial_code:'+354', code:'IS', price:7.12},
    {name:'India', dial_code:'+91', code:'IN', price:20},
    {name:'Indonesia', dial_code:'+62', code:'ID', price:5.22},
    {name:'Iran, Islamic Republic of', dial_code:'+98', code:'IR', price:14},
    {name:'Iraq', dial_code:'+964', code:'IQ', price:8.06},
    {name:'Ireland', dial_code:'+353', code:'IE', price:6.96},
    {name:'Israel', dial_code:'+972', code:'IL', price:3.14},
    {name:'Italy', dial_code:'+39', code:'IT', price:5.7},
    {name:'Jamaica', dial_code:'+1 876', code:'JM', price:1.11},
    {name:'Japan', dial_code:'+81', code:'JP', price:6.24},
    {name:'Jordan', dial_code:'+962', code:'JO', price:17},
    {name:'Kazakhstan', dial_code:'+7 7', code:'KZ', price:21.11},
    {name:'Kenya', dial_code:'+254', code:'KE', price:9.68},
    {name:'Kiribati', dial_code:'+686', code:'KI', price:14},
    {name:'Korea, Democratic People\'s Republic of', dial_code:'+850', code:'KP', price:20},
    {name:'Korea, Republic of', dial_code:'+82', code:'KR', price:6.3},
    {name:'Kuwait', dial_code:'+965', code:'KW', price:7.56},
    {name:'Kyrgyzstan', dial_code:'+996', code:'KG', price:5.04},
    {name:'Lao People\'s Democratic Republic', dial_code:'+856', code:'LA', price:3.28},
    {name:'Latvia', dial_code:'+371', code:'LV', price:6.6},
    {name:'Lebanon', dial_code:'+961', code:'LB', price:20},
    {name:'Lesotho', dial_code:'+266', code:'LS', price:3.6},
    {name:'Liberia', dial_code:'+231', code:'LR', price:6.75},
    {name:'Libyan Arab Jamahiriya', dial_code:'+218', code:'LY', price:4.5},
    {name:'Liechtenstein', dial_code:'+423', code:'LI', price:3.15},
    {name:'Lithuania', dial_code:'+370', code:'LT', price:5},
    {name:'Luxembourg', dial_code:'+352', code:'LU', price:10.1},
    {name:'Macao', dial_code:'+853', code:'MO', price:8},
    {name:'Macedonia, The Former Yugoslav Republic of', dial_code:'+389', code:'MK', price:20},
    {name:'Micronesia, Federated States of', dial_code:'+691', code:'FM', price:20},
    {name:'Madagascar', dial_code:'+261', code:'MG', price:3.4},
    {name:'Malawi', dial_code:'+265', code:'MW', price:4.9},
    {name:'Malaysia', dial_code:'+60', code:'MY', price:6.18},
    {name:'Maldives', dial_code:'+960', code:'MV', price:2.4},
    {name:'Mali', dial_code:'+223', code:'ML', price:16},
    {name:'Malta', dial_code:'+356', code:'MT', price:8.24},
    {name:'Marshall Islands', dial_code:'+692', code:'MH', price:15.56},
    {name:'Martinique', dial_code:'+596', code:'MQ', price:20},
    {name:'Mauritania', dial_code:'+222', code:'MR', price:5.4},
    {name:'Mauritius', dial_code:'+230', code:'MU', price:7.56},
    {name:'Mayotte', dial_code:'+262', code:'YT', price:20},
    {name:'Mexico', dial_code:'+52', code:'MX', price:2.24},
    {name:'Moldova, Republic of', dial_code:'+373', code:'MD', price:14.4},
    {name:'Monaco', dial_code:'+377', code:'MC', price:20},
    {name:'Mongolia', dial_code:'+976', code:'MN', price:4.2},
    {name:'Montenegro', dial_code:'+382', code:'ME', price:13.6},
    {name:'Montserrat', dial_code:'+1664', code:'MS', price:2.41},
    {name:'Morocco', dial_code:'+212', code:'MA', price:7.2},
    {name:'Mozambique', dial_code:'+258', code:'MZ', price:3.2},
    {name:'Myanmar', dial_code:'+95', code:'MM', price:11.92},
    {name:'Namibia', dial_code:'+264', code:'NA', price:5},
    {name:'Nauru', dial_code:'+674', code:'NR', price:3.79},
    {name:'Nepal', dial_code:'+977', code:'NP', price:8.6},
    {name:'Netherlands', dial_code:'+31', code:'NL', price:9},
    {name:'Netherlands Antilles', dial_code:'+599', code:'AN', price:20},
    {name:'New Caledonia', dial_code:'+687', code:'NC', price:7.92},
    {name:'New Zealand', dial_code:'+64', code:'NZ', price:9.08},
    {name:'Nicaragua', dial_code:'+505', code:'NI', price:5.64},
    {name:'Niger', dial_code:'+227', code:'NE', price:8.08},
    {name:'Nigeria', dial_code:'+234', code:'NG', price:13},
    {name:'Niue', dial_code:'+683', code:'NU', price:20},
    {name:'Norfolk Island', dial_code:'+672', code:'NF', price:20},
    {name:'Northern Mariana Islands', dial_code:'+1 670', code:'MP', price:20},
    {name:'Norway', dial_code:'+47', code:'NO', price:6.12},
    {name:'Oman', dial_code:'+968', code:'OM', price:10.62},
    {name:'Pakistan', dial_code:'+92', code:'PK', price:3.5},
    {name:'Palau', dial_code:'+680', code:'PW', price:9.48},
    {name:'Panama', dial_code:'+507', code:'PA', price:5.86},
    {name:'Papua New Guinea', dial_code:'+675', code:'PG', price:4.16},
    {name:'Paraguay', dial_code:'+595', code:'PY', price:3.84},
    {name:'Peru', dial_code:'+51', code:'PE', price:2.78},
    {name:'Philippines', dial_code:'+63', code:'PH', price:6.94},
    {name:'Poland', dial_code:'+48', code:'PL', price:3.2},
    {name:'Puerto Rico', dial_code:'+1 939', code:'PR', price:2.25},
    {name:'Qatar', dial_code:'+974', code:'QA', price:5},
    {name:'Réunion', dial_code:'+262', code:'RE', price:18.4},
    {name:'Romania', dial_code:'+40', code:'RO', price:9.12},
    {name:'Russia', dial_code:'+7', code:'RU', price:8.64},
    {name:'Rwanda', dial_code:'+250', code:'RW', price:9.6},
    {name:'Saint Barthélemy', dial_code:'+590', code:'BL', price:20},
    {name:'Saint Helena, Ascension and Tristan Da Cunha', dial_code:'+290', code:'SH', price:20},
    {name:'Saint Kitts and Nevis', dial_code:'+1 869', code:'KN', price:20},
    {name:'Saint Lucia', dial_code:'+1 758', code:'LC', price:24.1},
    {name:'Saint Martin', dial_code:'+590', code:'MF', price:20},
    {name:'Saint Pierre and Miquelon', dial_code:'+508', code:'PM', price:12.07},
    {name:'Saint Vincent and the Grenadines', dial_code:'+1 784', code:'VC', price:2.41},
    {name:'Samoa', dial_code:'+685', code:'WS', price:10.64},
    {name:'San Marino', dial_code:'+378', code:'SM', price:7.65},
    {name:'Sao Tome and Principe', dial_code:'+239', code:'ST', price:9},
    {name:'Saudi Arabia', dial_code:'+966', code:'SA', price:9.1},
    {name:'Senegal', dial_code:'+221', code:'SN', price:9},
    {name:'Serbia', dial_code:'+381', code:'RS', price:10.6},
    {name:'Seychelles', dial_code:'+248', code:'SC', price:3},
    {name:'Sierra Leone', dial_code:'+232', code:'SL', price:11.02},
    {name:'Singapore', dial_code:'+65', code:'SG', price:4.6},
    {name:'Slovakia', dial_code:'+421', code:'SK', price:9.1},
    {name:'Slovenia', dial_code:'+386', code:'SI', price:7.14},
    {name:'Solomon Islands', dial_code:'+677', code:'SB', price:31.1},
    {name:'Somalia', dial_code:'+252', code:'SO', price:12.7},
    {name:'South Africa', dial_code:'+27', code:'ZA', price:3.12},
    {name:'South Georgia and the South Sandwich Islands', dial_code:'+500', code:'GS', price:20},
    {name:'Spain', dial_code:'+34', code:'ES', price:4.5},
    {name:'Sri Lanka', dial_code:'+94', code:'LK', price:4.86},
    {name:'Sudan', dial_code:'+249', code:'SD', price:9.28},
    {name:'Suriname', dial_code:'+597', code:'SR', price:4.8},
    {name:'Swaziland', dial_code:'+268', code:'SZ', price:3.4},
    {name:'Sweden', dial_code:'+46', code:'SE', price:5.6},
    {name:'Switzerland', dial_code:'+41', code:'CH', price:5.2},
    {name:'Syrian Arab Republic', dial_code:'+963', code:'SY', price:8.76},
    {name:'Taiwan, Province of China', dial_code:'+886', code:'TW', price:6.04},
    {name:'Tajikistan', dial_code:'+992', code:'TJ', price:1.21},
    {name:'Tanzania, United Republic of', dial_code:'+255', code:'TZ', price:9.06},
    {name:'Thailand', dial_code:'+66', code:'TH', price:2.38},
    {name:'Timor-Leste', dial_code:'+670', code:'TL', price:12.33},
    {name:'Togo', dial_code:'+228', code:'TG', price:3.56},
    {name:'Tokelau', dial_code:'+690', code:'TK', price:20},
    {name:'Tonga', dial_code:'+676', code:'TO', price:4.1},
    {name:'Trinidad and Tobago', dial_code:'+1 868', code:'TT', price:2.41},
    {name:'Tunisia', dial_code:'+216', code:'TN', price:13.86},
    {name:'Turkey', dial_code:'+90', code:'TR', price:10.6},
    {name:'Turkmenistan', dial_code:'+993', code:'TM', price:7.51},
    {name:'Turks and Caicos Islands', dial_code:'+1 649', code:'TC', price:2.41},
    {name:'Tuvalu', dial_code:'+688', code:'TV', price:20},
    {name:'Uganda', dial_code:'+256', code:'UG', price:9.5},
    {name:'Ukraine', dial_code:'+380', code:'UA', price:3.12},
    {name:'United Arab Emirates', dial_code:'+971', code:'AE', price:3.2},
    {name:'Uruguay', dial_code:'+598', code:'UY', price:7.38},
    {name:'Uzbekistan', dial_code:'+998', code:'UZ', price:9},
    {name:'Vanuatu', dial_code:'+678', code:'VU', price:7.78},
    {name:'Venezuela, Bolivarian Republic of', dial_code:'+58', code:'VE', price:4.72},
    {name:'Vietnam', dial_code:'+84', code:'VN', price:9.48},
    {name:'Virgin Islands, British', dial_code:'+1 284', code:'VG', price:5.78},
    {name:'Virgin Islands, U.S.', dial_code:'+1 340', code:'VI', price:20},
    {name:'Wallis and Futuna', dial_code:'+681', code:'WF', price:20},
    {name:'Yemen', dial_code:'+967', code:'YE', price:3.04},
    {name:'Zambia', dial_code:'+260', code:'ZM', price:5.31},
    {name:'Zimbabwe', dial_code:'+263', code:'ZW', price:3.96}
  ];

  getCodes() {
    return this.countryCodes;
  }
}
