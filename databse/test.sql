-- INSERT INTO dbo.users (email, role, status) 
-- VALUES ('2331540055@vaa.edu.vn', 'org', 'active'),
--        ('luongkhang1410@gmail.com', 'admin_org', 'active');

select * from dbo.users;

select * from dbo.organizations;

select * from dbo.certificates;

select * from dbo.certificate_requests;
-- select * from dbo.logs;

-- update dbo.users set display_name='Bo Giao Duc' where role='admin_root';
-- update dbo.users set display_name='Hoc Vien Hang Khong' where role ='org';
-- update dbo.users set display_name='Khoa CNTT' where role ='admin_org';

-- delete from dbo.users where email = 'luongkhang1410@gmail.com';
