// User-supplied fiction. Stable IDs never depend on position or difficulty.
export const refugeArabic='أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ';
export const refugeMeaning='বিতাড়িত শয়তান থেকে আমি আল্লাহর আশ্রয় চাই।';
const story=(id,title,sentences,note,question,answer,phrases,questions,explanation)=>({id:'values-'+id,title,sentences,note,question,answer,phrases,questions,explanation,kind:'values',helpers:[],newWords:[],pictures:[],blanks:[],level:4});
// Questions use explicit picture evidence; two of these are also paragraph gaps.
// A question is [sentence index, missing word, two distractors, specific hint].
export const valuesStories=[
 story('bismillah-bite','Bismillah, then a bite',['A bun is on my plate.','I reach for the bun.','Mum smiles. “What do we say?”','“Bismillah!” I say.','I eat with my right hand.'],'খাওয়ার আগে বিসমিল্লাহ বলি এবং ডান হাতে খাই।','খাওয়ার আগে শিশুটি কী বলল?','বিসমিল্লাহ।',{'reach for':'নেওয়ার জন্য হাত বাড়ানো','right hand':'ডান হাত'},[[0,'bun',['cat','hat'],'Look—the bun is on the plate.'],[4,'hand',['foot','shoe'],'Look—the child is eating with a hand.']],'গল্পে শিশুটি বান খাওয়ার আগে বিসমিল্লাহ বলেছে। তারপর ডান হাতে খেয়েছে। আমরাও খাবার সামনে পেলে আল্লাহর নাম নিয়ে শুরু করি। ধীরে ধীরে খাই, আর ডান হাত ব্যবহার করি। মা-বাবার সঙ্গে এই সুন্দর অভ্যাসটি অনুশীলন করতে পারি।'),
 story('smile-friend','A smile for my friend',['A new boy sits by me.','He looks at the floor.','I smile and say, “Come and play!”','He smiles at me.','We play with my ball.'],'হাসিমুখে স্বাগত জানালে নতুন বন্ধুও আপন বোধ করতে পারে।','নতুন শিশুটিকে খেলায় নিতে আমরা কী বলতে পারি?','“এসো, একসঙ্গে খেলি।”',{'by me':'আমার পাশে'},[[1,'floor',['sky','tree'],'Look—the boy is looking down at the floor.'],[4,'ball',['cup','hat'],'Look—the children are playing with a ball.']],'নতুন ছেলেটি প্রথমে নিচের দিকে তাকিয়ে ছিল। শিশুটি হাসিমুখে তাকে খেলতে ডেকেছে। তারপর দুজন একসঙ্গে বল নিয়ে খেলেছে। নতুন কেউ এলে আমরা মিষ্টি করে কথা বলতে পারি। তাকে খেলায় ডাকলে তার একা লাগা কমতে পারে, আর বন্ধুত্ব শুরু হতে পারে।'),
 story('water-cat','Water for the cat',['A cat sits in the sun.','Its water bowl is empty.','I ask Mum for water.','We fill the bowl.','The cat drinks. I sit and watch.'],'প্রাণীর যত্ন নেওয়া এবং তাকে পানি দেওয়া ভালো কাজ।','বিড়ালকে সাহায্য করতে শিশুটি কী করল?','মায়ের সাহায্যে তার বাটিতে পানি দিল।',{'water bowl':'পানির বাটি'},[[0,'cat',['hen','pig'],'Look—a cat is sitting in the sun.'],[3,'bowl',['bag','hat'],'Look—the water is going into the bowl.']],'বিড়ালের পানির বাটি খালি ছিল। শিশুটি মায়ের কাছে পানি চেয়েছে। তারা বাটি ভরে দিয়েছে, আর বিড়াল পানি পান করেছে। প্রাণীরও পানি ও যত্ন লাগে। বড়দের সাহায্য নিয়ে নিরাপদে তাদের প্রয়োজন বুঝে সাহায্য করতে পারি। তারপর একটু দূর থেকে শান্তভাবে দেখি।'),
 story('salam-door','Salam at the door',['Knock, knock!','Dad is at the door.','“Assalamu alaikum!” I say.','Dad smiles and replies.','I give Dad a big hug.'],'সালাম দিয়ে আপনজনকে স্বাগত জানাই।','কেউ সালাম দিলে আমরা কী বলি?','ওয়া আলাইকুমুস সালাম।',{'Assalamu alaikum':'আপনার ওপর শান্তি বর্ষিত হোক','big hug':'আদর করে জড়িয়ে ধরা'},[[1,'door',['tree','bus'],'Look—Dad is standing at the door.'],[4,'Dad',['cat','bird'],'Look—the child is hugging Dad.']],'গল্পে বাবা দরজায় এসেছেন। শিশুটি তাঁকে সালাম দিয়েছে, আর বাবা হাসিমুখে উত্তর দিয়েছেন। তারপর তারা আদর করে জড়িয়ে ধরেছে। আপনজনকে সালাম দিয়ে স্বাগত জানাতে পারি। কেউ সালাম দিলে তার উত্তরও দিই। এতে আমাদের ভালোবাসা ও আন্তরিকতা প্রকাশ পায়।'),
 story('two-dates','One date, two smiles',['I have two dates.','My sister has none.','I give her one.','One for her. One for me.','We say, “Bismillah!”'],'নিজের খাবার থেকে ভাগ করে দিলে দুজনেরই আনন্দ হয়।','শিশুটি বোনকে কয়টি খেজুর দিল?','একটি।',{},[[0,'two',['three','four'],'Count the dates. There are two.'],[3,'One',['Two','Three'],'Look—each child has one date.']],'শিশুটির কাছে দুইটি খেজুর ছিল, আর বোনের কাছে একটিও ছিল না। সে বোনকে একটি দিয়েছে। এখন দুজনের কাছেই একটি করে খেজুর আছে। নিজের খাবার থেকে ভাগ করে দিলে একসঙ্গে আনন্দ করা যায়। তারা বিসমিল্লাহ বলে খাওয়ার প্রস্তুতি নিয়েছে।'),
 story('prayer-mat','My prayer mat',['Mum puts down her prayer mat.','I put mine beside it.','My little brother brings a towel.','“My mat!” he says.','Mum smiles. We get ready to pray.'],'পরিবারের সঙ্গে নামাজের প্রস্তুতি নিই; ছোটদের আগ্রহকে স্নেহ দিয়ে স্বাগত জানাই।','ছোট ভাইটি কী নিয়ে এসেছিল?','একটি তোয়ালে।',{'prayer mat':'জায়নামাজ','get ready':'প্রস্তুত হই','puts down':'বিছিয়ে দেন'},[[2,'towel',['cup','ball'],'Look—the little brother is carrying a towel.'],[2,'brother',['cat','bird'],'Look—the little brother brings the towel.']],'মা জায়নামাজ বিছিয়েছেন। শিশুটিও নিজের জায়নামাজ পাশে রেখেছে। ছোট ভাই তোয়ালে নিয়ে এসে সেটিকে নিজের মাদুর বলেছে। মা তার আগ্রহ দেখে হেসেছেন। পরিবারের সঙ্গে নামাজের প্রস্তুতি নিতে পারি। ছোটরা শিখতে চাইলে আমরা স্নেহ দিয়ে তাদের পাশে থাকি।'),
 story('red-cup','The red cup',['I bump a cup.','Water spills on the floor.','Mum asks, “What happened?”','“I did it,” I say.','We get a cloth and wipe it up.'],'ভুল হলে সত্য বলি এবং ঠিক করতে সাহায্য করি।','পানি পড়ে গেলে শিশুটি কী করল?','সত্য বলল এবং মায়ের সঙ্গে মুছে দিল।',{'wipe it up':'মুছে পরিষ্কার করা'},[[0,'cup',['hat','ball'],'Look—the child bumped a cup.'],[4,'cloth',['pencil','bun'],'Look—they are wiping with a cloth.']],'শিশুটির ধাক্কায় কাপের পানি মেঝেতে পড়েছে। মা জানতে চাইলে সে সত্য বলেছে। তারপর মায়ের সঙ্গে কাপড় দিয়ে পানি মুছে দিয়েছে। আমাদেরও ভুল হতে পারে। ভুল লুকিয়ে না রেখে সত্য বলি। বড়দের সাহায্য নিয়ে সেটি ঠিক করার চেষ্টা করি।'),
 story('quiet-surprise','A quiet surprise',['Mum is resting.','I see her shoes by the door.','I put them neatly together.','Mum gets up and sees them.','“Who helped me?” she asks. I smile.'],'ছোট কাজ দিয়েও মা-বাবাকে সাহায্য করতে পারি।','শিশুটি মাকে কীভাবে সাহায্য করল?','জুতাগুলো গুছিয়ে রাখল।',{'gets up':'উঠে দাঁড়ান','helped me':'আমাকে সাহায্য করেছে'},[[1,'shoes',['toys','dates'],'Look—there are shoes by the door.'],[1,'door',['tree','bus'],'Look—the shoes are beside the door.']],'মা বিশ্রাম নিচ্ছিলেন। শিশুটি দরজার পাশে মায়ের জুতা দেখে সুন্দর করে গুছিয়ে রেখেছে। মা উঠে তা দেখে খুশি হয়েছেন। সাহায্য করতে সব সময় বড় কাজ করতে হয় না। নিজের সাধ্যের ছোট, নিরাপদ কাজও করতে পারি। এভাবেই পরিবারে যত্ন প্রকাশ করি।'),
 story('thank-you','Thank you, Allah',['Dad cuts an apple.','I take a little bite.','Crunch! It is sweet.','I finish my apple.','“Alhamdulillah,” I say.'],'খাবার ও নিয়ামতের জন্য আল্লাহর শুকরিয়া করি।','শিশুটি কৃতজ্ঞতা জানিয়ে কী বলল?','আলহামদুলিল্লাহ।',{'little bite':'ছোট কামড়'},[[0,'apple',['bun','date'],'Look—Dad is cutting an apple.'],[0,'Dad',['cat','bird'],'Look—Dad is cutting the apple.']],'বাবা আপেল কেটে দিয়েছেন। শিশুটি ছোট কামড় দিয়ে খেয়েছে। আপেল শেষ করে সে আলহামদুলিল্লাহ বলেছে। খাবার ও নানা নিয়ামতের জন্য আমরা আল্লাহর শুকরিয়া করি। যারা খাবার প্রস্তুত করে দেন, তাঁদের প্রতিও কৃতজ্ঞ থাকি। ধীরে খাই এবং খাবারের যত্ন নিই।'),
 story('clear-path','A clear path',['We walk to the park.','A big twig is on the path.','“Someone may trip,” says Dad.','Dad moves it aside.','Now the path is clear.'],'অন্যের চলার পথ নিরাপদ রাখতে বড়দের সঙ্গে সাহায্য করি।','ডালটি সরানোর প্রয়োজন কেন ছিল?','কেউ হোঁচট খেতে পারত।',{},[[1,'twig',['cup','ball'],'Look—a twig is lying across the path.'],[3,'Dad',['cat','bird'],'Look—Dad moves the twig.']],'পার্কের পথে একটি ডাল পড়ে ছিল। বাবা বুঝেছেন, এতে কেউ হোঁচট খেতে পারে। তাই বাবা ডালটি পাশে সরিয়েছেন। শিশুটি দেখেছে পথটি এখন বাধামুক্ত। পথে বিপজ্জনক কিছু দেখলে নিজে ধরতে যাই না। বড়দের জানাই, আর তাঁদের সঙ্গে নিরাপদভাবে সাহায্য করি।'),
 story('little-bird','The little bird',['A little bird sits by our door.','It is a hot day.','Dad puts a bowl of water nearby.','We step back and wait.','The bird takes a drink!'],'পাখিকে পানি দিই এবং দূর থেকে শান্তভাবে দেখি।','পানি দেওয়ার পর তারা পিছিয়ে গেল কেন?','পাখিটি যেন ভয় না পেয়ে পানি পান করতে পারে।',{'step back':'একটু পিছিয়ে যাই','takes a drink':'পানি পান করে'},[[0,'bird',['cat','pig'],'Look—a little bird is beside the door.'],[2,'bowl',['hat','bag'],'Look—Dad puts water in a bowl.']],'গরম দিনে দরজার কাছে একটি পাখি ছিল। বাবা তার কাছে পানির বাটি রেখেছেন। তারপর সবাই একটু পিছিয়ে অপেক্ষা করেছে। পাখিটি নিশ্চিন্তে পানি পান করেছে। পাখির যত্ন নিতে বড়দের সাহায্য চাই। তাকে ভয় না দেখিয়ে দূর থেকে শান্তভাবে দেখাই ভালো।'),
 story('come-in','May I come in?',['Mum is in her room.','I knock on the door.','“May I come in?” I ask.','“Yes, come in,” says Mum.','I show her my new drawing.'],'কারও ঘরে ঢোকার আগে অনুমতি চাই।','শিশুটি দরজা খুলে ঢোকার আগে কী করল?','টোকা দিয়ে অনুমতি চাইল।',{'May I come in?':'আমি কি ভেতরে আসতে পারি?','come in':'ভেতরে এসো'},[[1,'door',['tree','bus'],'Look—the child is knocking on the door.'],[4,'drawing',['cup','ball'],'Look—the child is showing a drawing.']],'শিশুটি মায়ের ঘরে যাওয়ার আগে দরজায় টোকা দিয়েছে। সে জিজ্ঞেস করেছে, আমি কি ভেতরে আসতে পারি? মা অনুমতি দিলে সে ভেতরে গিয়ে ছবি দেখিয়েছে। কারও ঘরে ঢোকার আগে টোকা দিই এবং অনুমতি চাই। উত্তর না পাওয়া পর্যন্ত অপেক্ষা করি। এতে অন্যের ব্যক্তিগত জায়গাকে সম্মান করি।'),
 story('fallen-blocks','The fallen blocks',['My brother builds a tall tower.','I bump it with my foot.','Down go the blocks!','“I am sorry,” I say.','We build it again—together.'],'ভুল করলে ক্ষমা চাই এবং ক্ষতি ঠিক করতে সাহায্য করি।','শুধু “sorry” বলার পরে আর কী করল?','ভাইয়ের সঙ্গে আবার টাওয়ার বানাল।',{'I am sorry':'আমি দুঃখিত'},[[0,'tower',['cup','ball'],'Look—the blocks make a tall tower.'],[2,'blocks',['dates','shoes'],'Look—the blocks have fallen down.']],'ভাইয়ের বানানো টাওয়ারে শিশুটির পা লেগেছে। ব্লকগুলো পড়ে গেছে। শিশুটি দুঃখিত বলেছে এবং ভাইয়ের সঙ্গে আবার বানিয়েছে। ভুল হলে ক্ষমা চাইতে পারি। শুধু কথা বলেই থেমে না থেকে ক্ষতি ঠিক করতে সাহায্য করি। একসঙ্গে কাজ করলে আবার সুন্দর কিছু গড়া যায়।'),
 story('turns-bike','My turn, your turn',['I ride my red bike.','My sister waits by the gate.','“Your turn!” I say.','She rides. I clap.','Now we both have a big smile.'],'নিজের আনন্দের পাশাপাশি অন্যকেও সুযোগ দিই।','বোনের পালা এলে শিশুটি কী করল?','তাকে সাইকেল চালাতে দিল এবং হাততালি দিল।',{'Your turn':'তোমার পালা'},[[0,'bike',['bus','truck'],'Look—the child is riding a bike.'],[1,'gate',['bed','table'],'Look—the sister waits beside the gate.']],'শিশুটি নিরাপদ জায়গায় হেলমেট পরে সাইকেল চালিয়েছে। বোন অপেক্ষা করলে সে তাকে পালা দিয়েছে। বোন চালানোর সময় শিশুটি হাততালি দিয়েছে। দুজনই খুশি হয়েছে। নিজের আনন্দের পাশাপাশি অন্যকে সুযোগ দিতে পারি। পালা করে খেলি, আর নিরাপত্তার নিয়ম মেনে চলি।'),
 story('guest-date','A date for our guest',['Our guest sits with Dad.','I bring a plate of dates.','One date rolls off the plate!','Mum helps me pick it up.','We bring our guest a fresh date.'],'অতিথিকে যত্ন করে আপ্যায়ন করি।','পড়ে যাওয়া খেজুরের বদলে অতিথিকে কী দিল?','অন্য একটি পরিষ্কার খেজুর।',{'rolls off':'গড়িয়ে পড়ে','pick it up':'তুলে নিই','fresh date':'এখানে অন্য একটি পরিষ্কার খেজুর'},[[1,'dates',['shoes','blocks'],'Look—the plate holds dates.'],[1,'plate',['hat','bag'],'Look—the dates are on a plate.']],'শিশুটি অতিথির জন্য খেজুর এনেছে। একটি খেজুর পড়ে গেলে মা সেটি তুলতে সাহায্য করেছেন। অতিথিকে পড়ে যাওয়া খেজুর দেয়নি। অন্য একটি পরিষ্কার খেজুর দিয়েছে। অতিথিকে যত্ন করে আপ্যায়ন করি। খাবার পরিষ্কার রাখি এবং দরকার হলে বড়দের সাহায্য চাই।'),
 story('lost-pencil','The lost pencil',['I find a pencil on the floor.','It is not mine.','“Who lost a pencil?” I ask.','A girl puts up her hand.','I give it back. She smiles.'],'অন্যের জিনিস পেলে মালিককে ফেরত দিই।','পেন্সিলটি পেয়ে শিশুটি নিজের কাছে রাখল কি?','না, মালিককে খুঁজে ফেরত দিল।',{'puts up her hand':'হাত তোলে','give it back':'ফেরত দিই'},[[0,'pencil',['cup','hat'],'Look—a pencil is on the floor.'],[3,'hand',['foot','shoe'],'Look—the girl is raising her hand.']],'শিশুটি মেঝেতে একটি পেন্সিল পেয়েছে। সেটি নিজের নয় বুঝে মালিকের খোঁজ করেছে। একটি মেয়ে হাত তুললে তাকে পেন্সিলটি ফেরত দিয়েছে। অন্যের জিনিস পেলে নিজের কাছে রেখে দিই না। মালিককে খুঁজি, অথবা বড়দের জানাই। জিনিসটি যত্ন করে ফিরিয়ে দিই।'),
 story('little-gift','A little gift',['I draw a flower for Grandma.','I fold the paper.','“A gift for you!” I say.','Grandma opens it and smiles.','She puts my flower by her bed.'],'ভালোবাসা প্রকাশ করতে দামি উপহার লাগে না।','শিশুটি কী উপহার দিল?','নিজের আঁকা ফুলের ছবি।',{'for you':'তোমার জন্য'},[[0,'flower',['cat','truck'],'Look—the child is drawing a flower.'],[4,'bed',['bus','gate'],'Look—the flower drawing is beside Grandma’s bed.']],'শিশুটি দাদি বা নানির জন্য একটি ফুল এঁকেছে। কাগজ ভাঁজ করে উপহার দিয়েছে। তিনি তা খুলে হেসেছেন এবং বিছানার পাশে রেখেছেন। ভালোবাসা জানাতে দামি জিনিস প্রয়োজন হয় না। নিজের হাতে বানানো ছোট উপহারেও যত্ন থাকে। আন্তরিকভাবে কাউকে খুশি করতে পারি।'),
 story('busy-ant','The busy ant',['An ant walks by my shoe.','I lift my foot and stop.','It carries a tiny crumb.','I watch it walk past.','“Go on, little ant!”'],'ছোট প্রাণীকেও অকারণে কষ্ট দিই না।','পিঁপড়াটিকে যেতে দিতে শিশুটি কী করল?','পা সরিয়ে থামল।',{'Go on':'এগিয়ে যাও'},[[0,'ant',['cat','hen'],'Look—a tiny ant is beside the shoe.'],[2,'crumb',['cup','hat'],'Look—the ant carries a small crumb.']],'একটি পিঁপড়া জুতার পাশে দিয়ে যাচ্ছিল। শিশুটি পা সরিয়ে থেমেছে। পিঁপড়াটি খাবারের ছোট টুকরা নিয়ে চলে গেছে। ছোট প্রাণীকেও অকারণে কষ্ট দিই না। নিরাপদে একটু জায়গা ছেড়ে দিতে পারি। তাকে শান্তভাবে নিজের পথে যেতে দিই।'),
 story('ready-prayer','Ready for prayer',['Dad calls, “Time to pray.”','I put my toys in a box.','I make wudu with Dad.','We put our prayer mats side by side.','My toys can wait.'],'খেলা গুছিয়ে নামাজের প্রস্তুতি নিই।','নামাজের প্রস্তুতির আগে শিশুটি খেলনাগুলো কী করল?','বাক্সে গুছিয়ে রাখল।',{'Time to pray':'নামাজের সময়','make wudu':'অজু করি','prayer mats':'জায়নামাজগুলো','side by side':'পাশাপাশি'},[[1,'box',['hat','cup'],'Look—the toys are going into a box.'],[1,'toys',['dates','shoes'],'Look—the child is putting away toys.']],'বাবা নামাজের সময় হয়েছে বলে ডেকেছেন। শিশুটি খেলনা বাক্সে গুছিয়েছে। তারপর বাবার সঙ্গে অজু করে জায়নামাজ পাশে রেখেছে। খেলনা কিছুক্ষণ অপেক্ষা করতে পারে। পরিবারের সঙ্গে নামাজের প্রস্তুতি নিই। অজু ও নামাজের নিয়ম বড়দের কাছে ধীরে ধীরে শিখি।'),
 story('dua-mum','A dua for Mum',['Mum is not well today.','I bring her some water.','I sit quietly by her bed.','“Allah, please help Mum get well.”','Mum holds my hand.'],'অসুস্থ মানুষকে যত্ন করি এবং তার জন্য দোয়া করি।','শিশুটি মায়ের জন্য কোন দুটি কাজ করল?','পানি আনল এবং দোয়া করল।',{'not well':'অসুস্থ','get well':'সুস্থ হওয়া'},[[2,'bed',['bus','gate'],'Look—the child is sitting beside Mum’s bed.'],[4,'hand',['foot','shoe'],'Look—Mum is holding the child’s hand.']],'মা অসুস্থ ছিলেন। শিশুটি তাঁর জন্য পানি এনেছে এবং পাশে শান্তভাবে বসেছে। নিজের ভাষায় আল্লাহর কাছে মায়ের সুস্থতা চেয়েছে। এটি শিশুটির নিজের দোয়া। অসুস্থ মানুষকে যত্ন করি, বড়দের সাহায্য নিই এবং তার জন্য দোয়া করি। শান্তভাবে পাশে থাকাও ভালোবাসা।'),
 story('brother-friend','My brother, my friend',['My brother knocks down my blocks.','I feel angry.','I say, “A‘udhu billahi min ash-shaytan ir-rajim.”','“Please help me fix it,” I say.','We build the tower together.'],'রাগ হলে আল্লাহর আশ্রয় চাই এবং শান্তভাবে সমস্যার সমাধান করার চেষ্টা করি।','রাগ হলে শিশুটি কী বলল, তারপর কী করল?','আল্লাহর আশ্রয় চাইল এবং ভাইকে একসঙ্গে ঠিক করতে বলল।',{'knocks down':'ফেলে দেয়','feel angry':'রাগ লাগে'},[[0,'blocks',['dates','shoes'],'Look—the blocks have been knocked down.'],[4,'tower',['cup','truck'],'Look—the brothers are building the tower.']],'ভাই ব্লক ফেলে দিলে শিশুটির রাগ হয়েছে। সে আল্লাহর আশ্রয় চেয়েছে। তারপর শান্তভাবে ভাইকে একসঙ্গে ঠিক করতে বলেছে। দুজন মিলে টাওয়ার বানিয়েছে। রাগ হলে একটু থামি, আল্লাহর আশ্রয় চাই এবং নিরাপদে শান্ত হওয়ার চেষ্টা করি। তারপর কথা বলে সমস্যা ঠিক করতে পারি।'),
 story('not-hit-back','I will not hit back',['My brother hits my arm.','“Stop. That hurts,” I say.','I step away and call Mum.','Mum helps us. He says, “I am sorry.”','“I forgive you. Please do not hit me.”'],'পাল্টা না মেরে নিরাপদ দূরত্বে যাই এবং বড়দের সাহায্য চাই। ক্ষমা করা মানে আবার মার খেয়ে চুপ থাকা নয়।','কেউ মারলে কী করা যায়?','থামতে বলা, দূরে সরে যাওয়া এবং বিশ্বস্ত বড়দের সাহায্য নেওয়া।',{'step away':'দূরে সরে যাই','I am sorry':'আমি দুঃখিত'},[[0,'arm',['foot','shoe'],'Look—the child is holding a sore arm.'],[2,'Mum',['cat','bird'],'Look—the child calls Mum for help.']],'ভাই মারলে শিশুটি থামতে বলেছে। পাল্টা মারেনি। নিরাপদ দূরত্বে গিয়ে মাকে ডেকেছে। মা সাহায্য করেছেন। ক্ষমা করা ভালো, কিন্তু আবার মার খেয়ে চুপ থাকতে হয় না। কেউ কষ্ট দিলে দূরে সরে যাই। বিশ্বস্ত বড়দের জানাই এবং নিরাপদ থাকার সাহায্য চাই।'),
 story('brothers-truck','Two brothers, one truck',['I have a red toy truck.','My brother wants a turn.','I roll it to him.','He rolls it back to me.','One truck. Two happy brothers!'],'খেলনা ভাগ করে একসঙ্গে আনন্দ করতে পারি।','একটি খেলনা দিয়ে দুই ভাই কীভাবে খেলল?','একে অন্যের দিকে ট্রাকটি গড়িয়ে দিয়ে।',{'wants a turn':'একবার খেলতে চায়','toy truck':'খেলনা ট্রাক'},[[0,'truck',['bike','bus'],'Look—the toy is a truck.'],[4,'Two',['Three','Four'],'Count the brothers. There are two.']],'দুই ভাইয়ের কাছে একটি খেলনা ট্রাক ছিল। একজন অন্যজনের দিকে গড়িয়ে দিয়েছে, আর সে আবার ফিরিয়ে দিয়েছে। একটি খেলনা দিয়েই দুজন আনন্দ পেয়েছে। পালা করে খেলতে পারি। খেলনা ভাগ করে নিলে একসঙ্গে সময় কাটানো যায় এবং দুজনেরই হাসি ফুটতে পারে।')
];

const meanings=`a|একটি; উদাহরণ দেখো
an|একটি; উদাহরণ দেখো
the|নির্দিষ্ট জিনিসটি; উদাহরণ দেখো
I|আমি
my|আমার
me|আমাকে / আমার কাছে
we|আমরা
our|আমাদের
you|তুমি / তোমাকে
your|তোমার
he|সে
his|তার
him|তাকে
she|সে
her|তার / তাকে
it|এটি
its|এর
them|সেগুলো
us|আমাদের
is|আছে / হয়; উদাহরণ দেখো
am|আমি; উদাহরণ দেখো
are|আছে; উদাহরণ দেখো
have|আছে
has|আছে
on|ওপর
in|ভেতরে
at|কাছে
by|পাশে
to|দিকে / করতে; উদাহরণ দেখো
for|জন্য
with|সঙ্গে
of|এর
and|এবং
then|তারপর
can|পারে
not|না
do|করি
did|করেছি
say|বলি
says|বলে
what|কী
who|কে
yes|হ্যাঁ
none|একটিও নেই
one|একটি
two|দুইটি
both|দুজনই
now|এখন
come|এসো
go|যাও
get|নিই / হই; উদাহরণ দেখো
up|ওপরে
down|নিচে
back|ফিরিয়ে / পেছনে
off|সরে; উদাহরণ দেখো
out|বাইরে
away|দূরে
may|পারতে পারে / অনুমতি; উদাহরণ দেখো
please|অনুগ্রহ করে
that|সেটি
this|এটি
some|কিছু
today|আজ
again|আবার
together|একসঙ্গে
little|ছোট
big|বড়
new|নতুন
red|লাল
tall|উঁচু
hot|গরম
happy|খুশি
tiny|খুব ছোট
sweet|মিষ্টি
clear|বাধামুক্ত
empty|খালি
fresh|এখানে পরিষ্কার ও অন্য একটি
neatly|সুন্দর করে গুছিয়ে
quietly|শান্তভাবে
nearby|কাছাকাছি
beside|পাশে
mine|আমারটি
past|পাশ দিয়ে
right|এখানে ডান
ready|প্রস্তুত
well|এখানে সুস্থ
angry|রাগান্বিত
Mum|মা
Dad|বাবা
Grandma|দাদি / নানি
brother|ভাই
brothers|ভাইয়েরা
sister|বোন
boy|ছেলে
girl|মেয়ে
guest|অতিথি
someone|কেউ
Allah|আল্লাহ
Bismillah|আল্লাহর নামে
Alhamdulillah|সব প্রশংসা আল্লাহর
bun|বান রুটি
plate|থালা
hand|হাত
hands|হাতগুলো
floor|মেঝে
ball|বল
cat|বিড়াল
sun|সূর্য / রোদ
water|পানি
bowl|বাটি
door|দরজা
hug|জড়িয়ে ধরা
date|খেজুর
dates|খেজুরগুলো
mat|মাদুর
mats|মাদুরগুলো
prayer|নামাজ
towel|তোয়ালে
cup|কাপ
cloth|কাপড়
shoes|জুতা
shoe|জুতা
apple|আপেল
bite|কামড়
crunch|মচমচ শব্দ
park|পার্ক
twig|ছোট ডাল
path|চলার পথ
bird|পাখি
day|দিন
room|ঘর
drawing|আঁকা ছবি
blocks|খেলনা ব্লক
tower|টাওয়ার
foot|পা
bike|সাইকেল
gate|ফটক
turn|পালা
smile|হাসি / হাসি দিই
pencil|পেন্সিল
flower|ফুল
paper|কাগজ
gift|উপহার
bed|বিছানা
ant|পিঁপড়া
crumb|খাবারের ছোট টুকরা
time|সময়
toys|খেলনা
box|বাক্স
wudu|অজু
side|পাশ
arm|বাহু
truck|ট্রাক
toy|খেলনা
reach|হাত বাড়াই
eat|খাই
smiles|হাসে
sits|বসে
looks|তাকায়
play|খেলি
ask|চাই / জিজ্ঞেস করি; উদাহরণ দেখো
asks|জিজ্ঞেস করেন
fill|ভরি
drinks|পান করে
sit|বসি
watch|দেখি
knock|দরজায় টোকা
replies|উত্তর দেন
give|দিই
puts|রাখেন
put|রাখি
brings|নিয়ে আসে
pray|নামাজ পড়া
bump|ধাক্কা লাগানো
spills|পড়ে ছড়িয়ে যায়
happened|ঘটেছে
wipe|মুছি
resting|বিশ্রাম নিচ্ছেন
gets|উঠে / পায়; উদাহরণ দেখো
sees|দেখেন
see|দেখি
helped|সাহায্য করেছে
cuts|কাটেন
take|নিই
finish|শেষ করি
walk|হাঁটি
trip|হোঁচট খাওয়া
moves|সরান
aside|এক পাশে
step|এখানে পা সরিয়ে যাই
wait|অপেক্ষা করি
takes|এখানে পান করে
show|দেখাই
builds|বানায়
build|বানাই
sorry|দুঃখিত
ride|চালাই
rides|চালায়
waits|অপেক্ষা করে
clap|হাততালি দিই
bring|নিয়ে আসি
rolls|গড়িয়ে দেয় / পড়ে; উদাহরণ দেখো
helps|সাহায্য করেন
pick|তুলি
find|খুঁজে পাই
lost|হারিয়েছে
draw|আঁকি
fold|ভাঁজ করি
opens|খোলেন
walks|হাঁটে
lift|তুলি
stop|থামি / থামো
carries|বহন করে
calls|ডাকেন
make|এখানে করি
help|সাহায্য করা
holds|ধরে রাখেন
knocks|ধাক্কা দেয়
feel|অনুভব করি
fix|ঠিক করা
hits|মারে
hurts|ব্যথা লাগে
call|ডাকি
forgive|ক্ষমা করি
hit|মারো
wants|চায়
roll|গড়িয়ে দিই`;
export const storyLexicon=Object.fromEntries(meanings.split('\n').map(row=>row.split('|')));
const nouns={bun:'bun',plate:'plate',ball:'ball',cat:'cat',sun:'sun',bowl:'bowl',door:'door',date:'date',dates:'dates',mat:'prayer-mat',towel:'towel',cup:'red-cup',cloth:'cloth',shoes:'shoes',shoe:'shoe',apple:'apple',twig:'twig',bird:'bird',blocks:'blocks',tower:'tower',bike:'bike',gate:'gate',pencil:'pencil',flower:'flower',paper:'paper',drawing:'flower-drawing',bed:'bed',ant:'ant',crumb:'crumb',toys:'toys',box:'box',truck:'truck',hand:'hand',hands:'hand',foot:'foot',arm:'arm',floor:'floor',mum:'Mum',dad:'Dad',brother:'brother',sister:'sister',grandma:'Grandma'};
const actions=new Set('reach eat smile smiles sits looks play ask asks fill drinks sit watch knock replies give puts put brings pray bump spills wipe resting gets sees cuts take finish walk trip moves step wait takes show builds build ride rides waits clap bring rolls helps pick find draw fold opens walks lift stop carries calls make help holds knocks feel fix hits hurts call forgive hit wants roll'.split(' '));
export function vocabularyFor(s){
 const covered=new Set(),entries=[];
 for(const [word,meaning]of Object.entries(s.phrases)){
  const line=s.sentences.findIndex(t=>t.toLowerCase().includes(word.toLowerCase()));
  if(line<0)throw Error('Missing phrase '+s.id+': '+word);
  word.toLowerCase().match(/[a-z]+/g)?.forEach(w=>covered.add(w));
  const object={'prayer mat':'prayer-mat','water bowl':'water-bowl','toy truck':'truck','right hand':'hand','fresh date':'date'}[word];
  const action=/^(reach for|wipe it up|puts down|gets up|step back|pick it up|give it back|puts up her hand|knocks down|step away|big hug)$/.test(word);
  entries.push({word,meaning,line,example:s.sentences[line],kind:object?'object':action?'action':'example',object});
 }
 for(const [line,sentence]of s.sentences.entries()){
  if(s.id==='values-brother-friend'&&line===2)continue;
  for(const match of sentence.matchAll(/[A-Za-z]+/g)){
   const key=match[0].toLowerCase();if(covered.has(key))continue;covered.add(key);
   const canonical=Object.keys(storyLexicon).find(w=>w.toLowerCase()===key);
   if(!canonical)throw Error('Missing story meaning: '+s.id+' '+match[0]);
   const context={sun:'রোদ',her:/\bher (shoes|prayer|room|bed)\b/i.test(sentence)?'তার':'তাকে',me:/\b(by|for|to|at) me\b/i.test(sentence)?'আমার':'আমাকে',ask:s.id==='values-water-cat'?'চাই':'জিজ্ঞেস করি',smiles:/\b(Mum|Dad|Grandma)\b/.test(sentence)?'হাসেন':'হাসে',give:'দিই',with:s.id==='values-bismillah-bite'?'দিয়ে':'সঙ্গে',two:s.id==='values-brothers-truck'?'দুইজন':'দুইটি',am:'আছি; বাক্যের অর্থ দেখো'};
   entries.push({word:canonical,meaning:context[key]||storyLexicon[canonical],line,example:sentence,kind:nouns[key]?'object':actions.has(key)?'action':'example',object:nouns[key]});
  }
 }
 return entries;
}
const references={
 'values-bismillah-bite':[{label:'Sahih al-Bukhari 5376',url:'https://sunnah.com/bukhari:5376',note:'খাওয়ার আগে আল্লাহর নাম বলা ও ডান হাতে খাওয়ার আদব।'}],
 'values-smile-friend':[{label:'Sahih Muslim 2626',url:'https://sunnah.com/muslim:2626',note:'হাসিমুখে দেখা করার গুরুত্ব।'}],
 'values-water-cat':[{label:'Sahih al-Bukhari 2363',url:'https://sunnah.com/bukhari:2363',note:'মূল ঘটনায় একটি কুকুরকে পানি দেওয়া হয়েছিল। এই বিড়ালের গল্পটি নতুন কল্পকাহিনি।'}],
 'values-little-bird':[{label:'Sahih al-Bukhari 2363',url:'https://sunnah.com/bukhari:2363',note:'মূল ঘটনায় একটি কুকুরকে পানি দেওয়া হয়েছিল। এই পাখির গল্পটি নতুন কল্পকাহিনি।'}],
 'values-brother-friend':[{label:'Sahih al-Bukhari 6115',url:'https://sunnah.com/bukhari:6115',note:'রাগের সময় আল্লাহর আশ্রয় চাওয়ার বাক্য। গল্পটি হাদিসের উদ্ধৃতি নয়।'}]
};
for(const s of valuesStories){
 s.sourceLines=[...s.sentences];s.sceneLines=[];s.sentences=s.sourceLines.flatMap((text,line)=>{const parts=text.split(/(?<=[.!?])\s+(?=[A-Z“])/u);s.sceneLines.push(...parts.map(()=>line));return parts;});
 s.vocabulary=vocabularyFor(s);s.references=references[s.id]||[];
 s.questions=s.questions.map(([line,word,distractors,hint],i)=>({id:s.id+'-gap-'+i,line:s.sentences.findIndex((text,j)=>s.sceneLines[j]===line&&new RegExp('\\b'+word+'\\b').test(text)),word,choices:[...distractors.slice(0,i%2),word,...distractors.slice(i%2)],hint,task:'scene'}));
 s.blanks=s.questions.map(({line,word,choices})=>({line,word,choices}));
 s.play=[{...s.questions[0],id:'play-picture',type:'listen'},{...s.questions[1],id:'play-gap',type:'blank'},{id:'play-recall',type:'recall',line:s.questions[0].line,word:s.questions[0].word,choices:s.questions[0].choices,hint:'Listen to the story sentence again.'}];
}
// Editorial difficulty reflects decoding, dialogue, vocabulary and syntax;
// Bengali meanings alone never qualify a story as independently decodable.
export const valuesOrder=['brothers-truck','two-dates','salam-door','water-cat','thank-you','little-bird','bismillah-bite','smile-friend','lost-pencil','red-cup','prayer-mat','fallen-blocks','turns-bike','little-gift','busy-ant','ready-prayer','quiet-surprise','come-in','clear-path','guest-date','dua-mum','brother-friend','not-hit-back'].map(id=>'values-'+id);
const demands={
 'brothers-truck':'tr / br blends; toy (oy); brother; dialogue fragments',
 'two-dates':'date (a_e); sister; have; none; quoted speech',
 'salam-door':'oo / or; knock (silent k); replies; Arabic greeting',
 'water-cat':'ow / er; empty; fill; drinks (final blend); possessive Its',
 'thank-you':'apple; cuts; crunch (ch / cr); sweet (ee); gratitude phrase',
 'little-bird':'ir / er; nearby; step back; takes; hot day',
 'bismillah-bite':'plate / bite (a_e / i_e); reach (ea / ch); right (igh)',
 'smile-friend':'smile (i_e); friend; floor; come; dialogue',
 'lost-pencil':'pencil (soft c); floor; lost; give; ownership',
 'red-cup':'bump / spills blends; happened; cloth (th); wipe (i_e)',
 'prayer-mat':'pr / br; prayer; beside (i_e); towel; mine; family dialogue',
 'fallen-blocks':'bl / br; tower; foot (oo); sorry; again; dialogue fragments',
 'turns-bike':'turn (ur); bike (i_e); gate (a_e); rides; clap; both',
 'little-gift':'draw / Grandma blends; flower (ow); fold; opens; gift',
 'busy-ant':'lift / crumb blends; tiny (long y); carries; past; Go on',
 'ready-prayer':'ready (ea); wudu; prayer; side by side; calls; toys',
 'quiet-surprise':'quiet; resting; neatly (ea); together; helped; question',
 'come-in':'knock; permission phrase; room (oo); drawing (aw); dialogue',
 'clear-path':'twig / tr blends; someone; may; trip; aside; clear (ear)',
 'guest-date':'guest; plate (a_e); rolls; fresh (sh); pick it up; hygiene context',
 'dua-mum':'quietly; please; not well / get well; holds; original prayer',
 'brother-friend':'knocks; angry; fix; together; Arabic listening phrase',
 'not-hit-back':'hurts (ur); step away; forgive; safety dialogue; complex response'
};
valuesStories.forEach(s=>{s.demand=demands[s.id.slice(7)];s.level=4+Math.floor(valuesOrder.indexOf(s.id)/8);});
export function normalizeValuesLearning(raw){
 const valueStories={};for(const s of valuesStories)if(raw?.valueStories?.[s.id])valueStories[s.id]=normalizeValueProgress(raw.valueStories[s.id],s);
 const valid=new Set(valuesStories.flatMap(s=>s.vocabulary.map(v=>v.word.toLowerCase())));
 return {valueStories,valueWordsMet:[...new Set((Array.isArray(raw?.valueWordsMet)?raw.valueWordsMet:[]).filter(w=>valid.has(w)))],valueCurrent:valuesStories.some(s=>s.id===raw?.valueCurrent)?raw.valueCurrent:null};
}
export function emptyAttempt(){return {attempts:0,wrong:0,firstChoice:null,firstCorrect:null,assisted:false,demonstrated:false,easier:false,helpOpen:false};}
export function normalizeAttempt(raw,q){const base=emptyAttempt();if(!raw)return base;for(const k of ['attempts','wrong'])base[k]=Number.isInteger(raw[k])&&raw[k]>=0?Math.min(raw[k],10000):0;for(const k of ['assisted','demonstrated','easier','helpOpen'])base[k]=raw[k]===true;base.firstChoice=q.choices.includes(raw.firstChoice)?raw.firstChoice:null;base.firstCorrect=base.firstChoice===null?null:base.firstChoice===q.word;return base;}
export function valueSteps(s){return [{type:'vocabulary'},...s.sentences.map((_,line)=>({type:'sentence',line})),...s.questions.map((q,index)=>({type:'sentence-gap',q,index})),{type:'paragraph-gaps'},{type:'complete'},...s.play.map((q,index)=>({type:'play',q,index})),{type:'finish'}];}
export function normalizeValueProgress(raw,s){
 const n=valueSteps(s).length,questions=[...s.questions,...s.questions.map(q=>({...q,id:'paragraph-'+q.id})),...s.play];
 const answers={},attempts={};for(const q of questions){if(q.choices.includes(raw?.answers?.[q.id]))answers[q.id]=raw.answers[q.id];attempts[q.id]=normalizeAttempt(raw?.attempts?.[q.id],q);}
 const vocab=s.vocabulary.map(v=>v.word.toLowerCase());
 return {kind:'values',step:Number.isInteger(raw?.step)&&raw.step>=0&&raw.step<n?raw.step:0,vocab:Number.isInteger(raw?.vocab)&&raw.vocab>=0&&raw.vocab<s.vocabulary.length?raw.vocab:0,wordsMet:[...new Set((Array.isArray(raw?.wordsMet)?raw.wordsMet:[]).filter(w=>vocab.includes(w)))],review:raw?.review===true,reviewReturn:Number.isInteger(raw?.reviewReturn)&&raw.reviewReturn>=0&&raw.reviewReturn<n?raw.reviewReturn:0,blank:raw?.blank===1?1:0,answers,attempts,completed:[...new Set((Array.isArray(raw?.completed)?raw.completed:[]).filter(i=>Number.isInteger(i)&&i>=0&&i<n))],star:raw?.star===true,done:raw?.done===true,assisted:raw?.assisted===true};
}
export const valueAudioSpecs=[];
const add=(key,text,voice='en-GB-SoniaNeural',rate='-12%')=>valueAudioSpecs.push({key,text,voice,rate});
for(const s of valuesStories){
 for(const [line,text]of s.sentences.entries())if(!(s.id==='values-brother-friend'&&line===2))add('text:'+text,text);
 for(const v of s.vocabulary)add('value-word:'+v.word,v.word);
 for(const q of [...s.questions,...s.play])add('story-hint:'+q.hint,q.hint);
 for(const q of s.play)if(q.type==='listen')add('value-word:'+q.word,q.word);
 add('value-note:'+s.id,s.explanation,'bn-BD-NabanitaNeural','-8%');
}
add('value-instruction:picture','Listen, then choose the matching picture.');add('value-instruction:gap','Look at the picture. Choose the missing word.');add('value-instruction:recall','Which word was in the story?');add('value-instruction:retry','Listen and look. Now try with two choices.');add('value-praise','Well done! Read the sentence.');add('value-refuge-prefix','I say.');
