Gửi tin nhắn
Updated: 27 Tháng 3, 2026
Để gửi tin nhắn cho một người trên Messenger hoặc Instagram, người đó phải bắt đầu cuộc trò chuyện. Nền tảng Messenger có một số loại tin nhắn khác nhau mà bạn có thể gửi. Mỗi loại tin nhắn đều có các chính sách và nguyên tắc khác nhau về loại nội dung và điều kiện cho phép gửi tin nhắn.
Nếu người dùng ứng dụng của bạn không có Trang Facebook liên kết với tài khoản công việc trên Instagram, hãy tìm hiểu thêm về cách tạo ứng dụng qua API Instagram bằng phương thức Đăng nhập bằng Instagram.
Thông báo cho người dùng về trải nghiệm tự động
Khi luật hiện hành yêu cầu, trải nghiệm chat tự động phải khai báo rằng một người đang tương tác với dịch vụ tự động:
khi bắt đầu bất kỳ cuộc trò chuyện hoặc chuỗi tin nhắn nào,
sau một khoảng thời gian đáng kể hoặc
khi đoạn chat chuyển từ tương tác với con người sang trải nghiệm tự động.
Trải nghiệm chat tự động phục vụ những nhóm sau đây cần đặc biệt lưu ý đến yêu cầu nêu trên:
Thị trường California hoặc người dùng tại California
Thị trường Đức hoặc người dùng tại Đức
Các thông báo có thể bao gồm nhưng không giới hạn ở: "Tôi là bot của [Tên trang]", "Bạn đang tương tác với trải nghiệm tự động", "Bạn đang trò chuyện với bot" hoặc "Tôi là chatbot tự động".
Ngay cả khi luật pháp không yêu cầu, bạn vẫn nên thông báo cho người dùng khi họ đang tương tác với dịch vụ chat tự động. Cách làm tốt nhất này giúp kiểm soát kỳ vọng của người dùng khi họ tương tác với trải nghiệm nhắn tin.
Hãy truy cập vào Chính sách dành cho nhà phát triển của chúng tôi để biết thêm thông tin.
Thành phần tin nhắn
Mọi yêu cầu API Gửi từ ứng dụng của bạn để gửi một tin nhắn đều phải bao gồm thông tin sau đây:
ID Trang của Trang Facebook hoặc Trang Facebook liên kết với tài khoản Công việc trên Instagram đang gửi tin nhắn
ID của người nhận tin nhắn
Mã truy cập Trang mà Trang gửi tin nhắn yêu cầu
Quyền từ người nhận tin nhắn
Loại tin nhắn
Nội dung tin nhắn
Để biết thêm thông tin về các thành phần tin nhắn, hãy truy cập Tài liệu tham khảo về API Gửi.
Khoảng thời gian nhắn tin tiêu chuẩn
Khoảng thời gian nhắn tin tiêu chuẩn là khoảng thời gian 24 giờ mà bạn được phép gửi tin nhắn cho một người. Khi một người gửi tin nhắn đến Trang hoặc tài khoản Công việc trên Instagram của bạn hay bắt đầu cuộc trò chuyện qua plugin trên web, ứng dụng của bạn có tối đa 24 giờ để gửi tin nhắn.
Các tin nhắn gửi trong khoảng thời gian 24 giờ có thể chứa nội dung quảng cáo.
Hành động của người dùng sẽ mở khoảng thời gian nhắn tin tiêu chuẩn
Sau đây là những hành động của người dùng sẽ mở khoảng thời gian nhắn tin tiêu chuẩn 24 giờ:
Một người gửi tin nhắn cho Trang hoặc tài khoản Công việc trên Instagram của bạn
Một người nhấp vào nút kêu gọi hành động như nút Bắt đầu trong cuộc trò chuyện
Một người nhấp vào quảng cáo Click đến Messenger rồi gửi tin nhắn cho Trang hoặc tài khoản Công việc trên Instagram của bạn
Một người gửi tin nhắn cho Trang qua plugin, chẳng hạn như plugin Gửi đến Messenger hoặc Ô để đánh dấu
Một người nhấp vào liên kết m.me đưa họ đến cuộc trò chuyện hiện có giữa người đó và Trang
Một người nhấp vào liên kết ig.me đưa họ đến cuộc trò chuyện hiện có giữa người đó và tài khoản Công việc trên Instagram
Một người bày tỏ cảm xúc với tin nhắn, chẳng hạn như tin nhắn marketing
Một người bình luận về bài viết trên Trang hoặc tài khoản Công việc trên Instagram của bạn
Một người đăng bài viết của khách truy cập trên Trang của bạn
Chúng tôi biết rằng mọi người đều mong nhận được phản hồi kịp thời, vì vậy, bạn nên trả lời sớm nhất có thể trong khoảng thời gian 24 giờ này. Mọi người có thể chặn hoặc tắt cuộc trò chuyện bất cứ lúc nào.
ID người nhận
ID của người nhận tin nhắn được đặt trong thông số đối tượng recipient và có thể là một trong những loại ID sau đây:
ID trong Trang (PSID) - ID được chỉ định cho một người vào lần đầu tiên người đó gửi tin nhắn đến Trang của bạn. ID riêng biệt này biểu thị hoạt động tương tác giữa Trang của bạn và người đó.
Tham chiếu người dùng - ID được chỉ định cho người gửi tin nhắn đến Trang của bạn qua plugin hoặc nút yêu cầu đăng lại.
ID bài viết hoặc ID bình luận: ID được chỉ định cho người đăng bài viết trên Trang của bạn hoặc bình luận về bài viết. Được dùng để gửi Tin trả lời riêng tư cho người đó.
Lưu ý rằng ID người dùng từ tiện ích tích hợp Đăng nhập bằng Facebook là ID người dùng trong ứng dụng và sẽ không hoạt động với nền tảng Messenger.
Loại nhắn tin
Loại tin nhắn mà bạn đang gửi được đặt trong thông số messaging_type. Thông số này là một cách rõ ràng hơn để đảm bảo việc bạn nhắn tin tuân thủ các chính sách nhắn tin và tùy chọn của người nhận.
Dưới đây là các loại tin nhắn được hỗ trợ:
Tin nhắn trả lời - Tin nhắn bạn đang gửi là tin trả lời một tin nhắn đã nhận. Tin nhắn này có thể chứa nội dung quảng cáo lẫn nội dung không mang tính quảng cáo và phải được gửi trong khoảng thời gian nhắn tin tiêu chuẩn.
Tin nhắn cập nhật - Tin nhắn bạn đang gửi được chủ động gửi đi và không phải là tin nhắn trả lời một tin nhắn đã nhận. Tin nhắn này có thể chứa nội dung quảng cáo lẫn nội dung không mang tính quảng cáo và phải được gửi trong khoảng thời gian nhắn tin tiêu chuẩn.
Tin nhắn được gắn thẻ - Tin nhắn bạn đang gửi được gửi đi ngoài khoảng thời gian nhắn tin tiêu chuẩn. Tin nhắn này phải có thẻ tin nhắn khớp với trường hợp sử dụng được phép của thẻ đó và chứa nội dung không mang tính quảng cáo.
Thẻ tin nhắn
Kể từ ngày 27/04/2026, mọi yêu cầu API chứa Thẻ tin nhắn CONFIRMED_EVENT_UPDATE, ACCOUNT_UPDATE và POST_PURCHASE_UPDATE đều sẽ nhận được mã lỗi 100.
Với Thẻ tin nhắn, bạn có thể gửi tin nhắn ngoài khoảng thời gian nhắn tin tiêu chuẩn. Đây là những tin nhắn cập nhật phù hợp với cá nhân của một người. Ví dụ: bạn có thể gửi thông tin mới về hoạt động vận chuyển và giao hàng, thông tin đặt vé hoặc chuyến bay sắp tới hay thông báo về tài khoản của khách hàng. Đối với quy trình nhắn tin cần có lộ trình báo cáo lên nhân viên, thẻ Human Agent cho phép người đại diện doanh nghiệp trả lời tin nhắn của một người theo cách thủ công trong vòng 7 ngày.
Không được dùng Thẻ tin nhắn để gửi nội dung quảng bá, bao gồm nhưng không giới hạn ở các giao dịch, ưu đãi, phiếu giảm giá và chiết khấu. Nếu sử dụng Thẻ tin nhắn ngoài các trường hợp sử dụng được phê duyệt, Trang hoặc tài khoản Instagram có thể bị hạn chế khả năng gửi tin nhắn. Hãy xem Chính sách nền tảng Messenger và API Nhắn tin trên Instagram để biết chi tiết.
Những doanh nghiệp dùng Nền tảng Messenger muốn gửi tin nhắn quảng bá ngoài khoảng thời gian nhắn tin tiêu chuẩn 24 giờ nên sử dụng Tin nhắn được tài trợ hoặc Thông báo một lần.
Loại nội dung
Tin nhắn bạn gửi có thể chứa các loại nội dung sau đây:
Âm thanh
Nút
File
Menu
File GIF
Hình ảnh
Mẫu
Văn bản
Video
Gửi văn bản cơ bản
Để gửi tin nhắn văn bản cơ bản cho một người đã gửi tin nhắn đến Trang của bạn, hãy gửi yêu cầu POST đến điểm cuối /PAGE-ID/messages với khóa chữ của đối tượng recipientid được đặt là ID trong Trang (PSID) của người đó, thông số message_type được đặt là RESPONSE và đối tượng message của thông số text được đặt là nội dung tin nhắn.
Yêu cầu mẫu
curl -X POST -H "Content-Type: application/json" -d '{
  "recipient":{
    "id":"<PSID>"
  },
  "messaging_type": "RESPONSE",
  "message":{
    "text":"Hello, world!"
  }
}' "https://graph.facebook.com/v25.0/{PAGE-ID}/messages?access_token={PAGE-ACCESS-TOKEN}"
Nếu thành công, ứng dụng của bạn sẽ nhận được phản hồi JSON sau đây có chứa ID người nhận và ID tin nhắn.
{
  "recipient_id": "PAGE-SCOPED-ID",
  "message_id": "AG5Hz2U..."
}
Gửi file phương tiện đính kèm
Nếu bạn muốn gửi tin nhắn có chứa file phương tiện, chẳng hạn như file GIF/hình ảnh/mẫu, hãy thêm nội dung đó vào yêu cầu API trong đối tượng file đính kèm tin nhắn ở định dạng JSON.
Để gửi tin nhắn có chứa hình ảnh cho một người đã gửi tin nhắn đến Trang của bạn, hãy gửi yêu cầu POST đến điểm cuối /PAGE-ID/messages với khóa chữ của đối tượng recipientid được đặt là ID trong Trang (PSID) của người đó, thông số message_type được đặt là RESPONSE, khóa message trong đối tượng attachment của thông số type được đặt là image và khóa payload trong đối tượng url được đặt là URL của hình ảnh.
Yêu cầu mẫu
curl -X POST -H "Content-Type: application/json" -d '{
  "recipient":{
    "id":"1254459154682919"
  },
  "message":{
    "attachment":{
      "type":"image",
      "payload":{
        "url":"http://www.messenger-rocks.com/image.jpg",
        "is_reusable":true
      }
    }
  }
}' "https://graph.facebook.com/v25.0/me/messages?access_token={PAGE_ACCESS_TOKEN}"
Nếu thành công, ứng dụng của bạn sẽ nhận được phản hồi JSON sau đây có chứa ID người nhận và ID tin nhắn.
{
  "recipient_id": "PAGE-SCOPED-ID",
  "message_id": "AG5Hz2U..."
}
Bạn sẽ sử dụng cùng một định dạng khi gửi âm thanh, video hoặc một file từ URL.
Bạn cũng có thể gửi file phương tiện từ máy chủ của mình hoặc từ nội dung bạn đã tải lên máy chủ của Meta trước đây. Tìm hiểu thêm về cách tải file lên bằng API Tải file đính kèm lên.
Gửi nhiều file phương tiện đính kèm
Nếu bạn muốn gửi tin nhắn có chứa nhiều hình ảnh, hãy thêm nội dung đó vào yêu cầu API trong mảng file đính kèm tin nhắn ở định dạng JSON. Loại file phương tiện duy nhất cho phép là hình ảnh và bạn chỉ được thêm tối đa 30 hình ảnh mỗi lần.
Để gửi tin nhắn có chứa nhiều hình ảnh cho một người đã gửi tin nhắn đến Trang của bạn, hãy gửi yêu cầu POST đến điểm cuối /PAGE-ID/messages với khóa chữ của đối tượng recipientid được đặt là ID trong Trang (PSID) của người đó, thông số message_type được đặt là RESPONSE, thông số message có chứa mảng attachments, trong đó khóa type của mỗi đối tượng file đính kèm được đặt là image và khóa payload của đối tượng url được đặt là URL của hình ảnh.
Yêu cầu mẫu
curl -X POST -H "Content-Type: application/json" -d '{
  "recipient": {
    "id": "1254459154682919"
  },
  "message": {
    "attachments": [
      {
        "type": "image",
        "payload": {
          "url": "http://www.messenger-rocks.com/image.jpg"
        }
      },
      {
        "type": "image",
        "payload": {
          "url": "http://www.messenger-rocks.com/image.jpg"
        }
      }
    ]
  }
}' "https://graph.facebook.com/v25.0/me/messages?access_token={PAGE_ACCESS_TOKEN}"
Nếu thành công, ứng dụng của bạn sẽ nhận được phản hồi JSON sau đây có chứa ID người nhận và ID tin nhắn.
{
  "recipient_id": "PAGE-SCOPED-ID",
  "message_id": "AG5Hz2U..."
}
Gửi tin trả lời cho tin nhắn
Để gửi tin trả lời cho tin nhắn cụ thể trước đây trong đoạn chat, hãy gửi yêu cầu POST đến /PAGE-ID/messages kèm theo thông tin sau:
recipient khóa chữ của đối tượng id được đặt là ID trong trang (PSID) của người dùng
message_type được đặt là RESPONSE
chi tiết tin nhắn trong đối tượng thông số tin nhắn
mid khóa chữ của đối tượng reply_to được đặt là ID tin nhắn của tin nhắn cụ thể trong đoạn chat mà bạn muốn trả lời
Tin nhắn có thể là tin nhắn mà Trang hoặc người dùng đã gửi.
Yêu cầu mẫu
curl -X POST -H "Content-Type: application/json" -d '{
  "recipient": {
    "id": "<PSID>",
  }
  "messaging_type": "RESPONSE"
  "message": {
    "text": "Hello, world!"
  },
  "reply_to": {
    "mid": "{MESSAGE_ID}"
  }
}' "https://graph.facebook.com/v23.0/{PAGE-ID}/messages?access_token={PAGE_ACCESS_TOKEN}"
Nếu thành công, ứng dụng của bạn sẽ nhận được phản hồi JSON sau đây có chứa ID người nhận và ID tin nhắn.
{
  "recipient_id": "PAGE-SCOPED-ID",
  "message_id": "AG5Hz2U…"
}
Cách làm tốt nhất
Tin nhắn văn bản
Viết ngắn gọn. Cân nhắc kích thước màn hình và hành vi cuộn; tin nhắn ngắn gọn giúp mọi người dễ theo dõi hơn. Hãy thử gửi một vài tin nhắn riêng lẻ thay cho tin nhắn dài.
Không dùng văn bản thay thế cho hình ảnh, bảng, biểu đồ và hình ảnh. Tin nhắn có cấu trúc hay thậm chí chế độ xem web có thể phù hợp với nhu cầu của bạn hơn.
Không viết nội dung trao đổi dài dòng. Nếu bạn cần truyền đạt nhiều nội dung, hãy thử gửi một vài tin nhắn riêng lẻ thay cho tin nhắn dài.
File đính kèm
Chú ý đến chất lượng. Sử dụng hình ảnh nhiều màu sắc có độ phân giải cao để làm nổi bật tin nhắn.
Cân nhắc tỷ lệ khung hình. Xem xét cách có thể cắt hình ảnh khi hình ảnh đó hiển thị trong bong bóng tin nhắn.
Không đưa nhiều văn bản vào hình ảnh. Thay vào đó, hãy sử dụng tin nhắn văn bản hoặc kết hợp hình ảnh và văn bản theo mẫu chung.
Loại tin nhắn khác
Tin nhắn marketing
Với Tin nhắn marketing, bạn có thể yêu cầu một người cấp quyền để gửi nhiều tin nhắn marketing sau khi hết khoảng thời gian nhắn tin tiêu chuẩn. Nếu người đó chấp nhận yêu cầu vừa nêu để nhận các thông báo này, bạn sẽ có thể gửi cho người đó tin nhắn quảng bá tự động, định kỳ kèm theo thông tin về chương trình giảm giá sắp tới hoặc bản phát hành và bản cập nhật sản phẩm.
Nhắn tin về tin tức (đang phát triển)
Tính năng Nhắn tin về tin tức chỉ dành cho những nhà phát hành tin tức đã đăng ký sử dụng Chỉ mục Trang tin tức (NPI) của Facebook. Với tính năng Nhắn tin về tin tức, nhà phát hành tin tức có thể gửi tin nhắn về tin tức, không mang tính quảng bá cho những người đã đăng ký nhận các tin nhắn này.
Tính năng Nhắn tin về tin tức không dùng được cho API Nhắn tin trên Instagram.
Thông báo một lần
Với Thông báo một lần, bạn có thể yêu cầu một người cấp quyền để gửi một tin nhắn trao đổi thêm sau khi hết khoảng thời gian nhắn tin tiêu chuẩn. Nếu người đó chấp nhận yêu cầu này để nhận thông báo một lần, bạn sẽ có thể gửi một tin nhắn có giới hạn thời gian và liên quan đến cá nhân, chẳng hạn như lời nhắc về cuộc hẹn hoặc thông báo hàng về.
Thông báo một lần không dùng được cho API Nhắn tin trên Instagram.
Tin trả lời riêng tư
Với Tin trả lời riêng tư, bạn có thể gửi tin nhắn cho một người khi người đó đăng bình luận về một trong những bài viết/quảng cáo của bạn hoặc đăng bài viết của khách truy cập lên Trang/tài khoản Công việc trên Instagram của bạn. Tin trả lời riêng tư chỉ có thể là một tin nhắn, sẽ tự động bao gồm liên kết đến bài viết/bình luận đó và phải được gửi trong vòng 7 ngày kể từ ngày người đó đăng bài viết/bình luận.
Tin nhắn được tài trợ
Với Tin nhắn được tài trợ, bạn có thể gửi nội dung quảng bá hoặc không mang tính quảng bá cho người dùng từng gửi tin nhắn đến Trang/tài khoản Công việc trên Instagram của bạn sau khi hết khoảng thời gian nhắn tin tiêu chuẩn. Tin nhắn được tài trợ trông giống như tin nhắn bình thường trong cuộc trò chuyện nhưng có dòng chữ chú thích là "Được tài trợ" ở phía trên tin nhắn. Nội dung tin nhắn được tài trợ phải tuân thủ chính sách quảng cáo⁠.
Tin nhắn được tài trợ không dùng được cho API Nhắn tin trên Instagram.
Tin nhắn tiện ích
Với Tin nhắn tiện ích, bạn có thể gửi tin nhắn mẫu được phê duyệt trước có chứa đơn đặt hàng, thông tin mới về tài khoản và cuộc hẹn. Những tin nhắn này mang tính cá nhân cao với số tài khoản, ID đơn đặt hàng, số theo dõi quá trình vận chuyển, ngày giờ hẹn và có thể chứa lời kêu gọi hành động để người dùng hủy đơn đặt hàng, đổi lịch hẹn cùng các hành động khác giúp tương tác với doanh nghiệp dễ dàng hơn.
Bước tiếp theo
Tìm hiểu về các thành phần bạn có thể thêm vào tin nhắn trong cuộc trò chuyện.
Tìm hiểu thêm
Tìm hiểu thêm về cách gửi tin nhắn bằng Nền tảng Messenger.
Tài liệu tham khảo về API Tải file đính kèm lên – Tìm hiểu thêm về cách tải lên và gửi file phương tiện.
Tài liệu tham khảo về API Gửi – Tìm hiểu thêm về tất cả thẻ, nội dung và file đính kèm mà bạn có thể gửi.
Giới hạn tốc độ - Tìm hiểu về giới hạn tốc độ khi gửi tin nhắn bằng Nền tảng Messenger.
Hỗ trợ nhà phát triển
Sử dụng công cụ Trạng thái trên Meta⁠ để kiểm tra trạng thái và tình trạng ngừng hoạt động của các sản phẩm kinh doanh trên Meta.
Sử dụng công cụ Hỗ trợ nhà phát triển trên Meta để báo cáo lỗi và xem các lỗi đã báo cáo, yêu cầu trợ giúp về Quảng cáo hoặc Trình quản lý kinh doanh, v.v.
Hãy truy cập Thông tin và nguồn lực hỗ trợ cho Nền tảng Messenger để xem thêm thông tin và nguồn lực hỗ trợ về Nền tảng Messenger.