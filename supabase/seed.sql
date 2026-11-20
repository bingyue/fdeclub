insert into public.cities(slug,name,region,focus) values
('beijing','北京','华北','AI产业 · 专业服务'),('shanghai','上海','华东','产业创新 · 企业数字化'),('hangzhou','杭州','华东','电商科技 · 智能应用'),('shenzhen','深圳','华南','硬件创新 · 供应链'),('chengdu','成都','西南','软件服务 · 人才共建'),('qingdao','青岛','华北','智能制造 · 工业互联网') on conflict(slug) do nothing;
insert into public.membership_plans(slug,name,benefits) values ('registered','注册会员',array['公开交流','活动信息','城市连接']),('annual','年度会员意向',array['主题活动','专题交流','共创参与']),('industry','产业伙伴',array['活动共建','场景诊断','人才合作']) on conflict(slug) do nothing;
insert into public.site_settings(key,value) values ('home', '{"eyebrow":"城市共建伙伴 · 开放招募","description":"连接企业需求、FDE实战专家、城市伙伴与产业资源，从一次真实的对话，走向可交付的AI实践。","show_events":true}'),('event_types','["企业沙龙","城市Meetup","共创工作坊","产业论坛"]') on conflict(key) do nothing;
