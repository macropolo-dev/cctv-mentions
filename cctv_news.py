#!/usr/bin/env python
# coding: utf-8

# In[2]:


import numpy as np
import pandas as pd
import os
import requests
from bs4 import BeautifulSoup
import bs4, requests, sys
import scrapy
#import re
import datetime

# # Use a service account
# cred = credentials.Certificate('cctv-mentions-400547157f63.json')
# firebase_admin.initialize_app(cred, {'projectId': 'committee-dev-78cf7'})
# db = firestore.client()
# mentions_ref = db.collection(u'cctv_mentions')
# print(mentions_ref)


news = pd.read_csv(r'CCTV_update_data.csv')


# ## 2.2 Import the Built-In Function

# In[76]:


def parse_cctv(df):

    # start_date = df.iloc[-1]['Date']
    start_date = datetime.date.today().strftime('%Y%m%d')
    # start_date = '20210801'
    start_date_list = start_date.split('-')
    start_date = "".join(start_date_list)


    end_date = datetime.date.today() # today


    def trans_format(date1): # change date format to "xxxx(year)xx(month)xx(day), e.g. 20210801"
        date_year = str(date1.year)
        date_month = str(date1.month)
        date_day = str(date1.day)

        if len(date_month) == 1:
            date_month = "0" + date_month
        else:
            pass

        if len(date_day) == 1:
            date_day = "0" + date_day
        else:
            pass

        date_format = date_year + date_month + date_day

        return date_format

    end_date = trans_format(end_date)

    # start_date, end_Date should be like str ‘20160601’ or the datetime format
    date_list=[datetime.datetime.strftime(x,'%Y%m%d') for x in list(pd.date_range(start = start_date, end = end_date))]
    print(date_list)
    news_df = pd.DataFrame()
    no_list = []

    #! we need to change the headers
    headers_chrome = {'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'}
    for d in date_list:

        try:
            date_df = pd.DataFrame()
            news_year = d[0:4]
            news_month = d[4:6]
            news_day = d[6:]
            url_date = 'https://cn.govopendata.com/xinwenlianbo/{}/'.format(d)
            print(url_date)
            res = requests.get(url_date, headers = headers_chrome)
            soup = BeautifulSoup(res.content)
            headline = soup.find_all('h2', class_ = 'h4')
            content = soup.find_all('p')

            for i in range(len(headline)):
                date_df.loc[i, 'date'] = datetime.datetime(int(news_year), int(news_month), int(news_day))
                date_df.loc[i, 'year-month'] = news_year + '-' + news_month
                date_df.loc[i, 'year'] = news_year
                date_df.loc[i, 'month'] = news_month
                date_df.loc[i, 'day'] = news_day
                date_df.loc[i, 'series'] = i+1
                date_df.loc[i, 'headline'] = headline[i].text
                date_df.loc[i, 'content'] = content[i].text

            news_df = news_df.append(date_df)
            # print(news_df)
            #print('News for {} has been successfully parsed!'.format(d))

        except:
            # print('You should manually add news for {}'.format(d))
            no_list.append(d)

    news_df = news_df.sort_values(by = ['date', 'series'], ascending = [False, True]) # ranking based on dates
    news_df = news_df.reset_index()
    news_df.drop(['index'], axis=1, inplace = True)

    #print('We are unable to web scrape news for the following dates')
    #print(no_list)

    def calculate_appearance(df1, name_list, get = 'content', unit = 'monthly'):

        df1 = df1.dropna(axis=0, how='any')


        column_name = 'Date'
        date_format = "%Y-%m-%d"

        df1[column_name] = df1['date'].dt.strftime(date_format)

        appear = pd.DataFrame()
        appear[column_name] = list(set(list(df1[column_name])))
        appear = appear.set_index([column_name])

        for n in name_list:
            appear[n] = 0

        for key, value in df1.iterrows():
            for n in name_list:
                if n in value[get]:
                    appear.loc[value[column_name], n] += 1
            if ('习近平' not in value[get]) and ('习主席' not in value[get]) and ('习总书记' in value[get]):
                appear.loc[value[column_name], '习近平'] += 1
            if ('习近平' not in value[get]) and ('习总书记' not in value[get]) and ('习主席' in value[get]):
                appear.loc[value[column_name], '习近平'] += 1

        appear = appear.sort_values([column_name], ascending = True)

        return appear

    news_appear = calculate_appearance(news_df, ['习近平', '李克强', '栗战书', '汪洋', '王沪宁', '赵乐际', '韩正'])

    news_appear = news_appear.rename(columns={'习近平':'Xi Jinping', '李克强':'Li Keqiang', '栗战书':'Li Zhanshu', '汪洋':'Wang Yang', '王沪宁':'Wang Huning', '赵乐际':'Zhao Leji', '韩正':'Han Zheng'})

    news_appear = news_appear.reset_index()


    news_appear_merge = pd.concat([df, news_appear])

    news_appear_merge = news_appear_merge.drop_duplicates(subset=['Date'])

    news_appear_merge = news_appear_merge.sort_values(['Date'], ascending = True)

    news_appear_merge = news_appear_merge.reset_index()

    news_appear_merge = news_appear_merge.drop(columns='index')

    # news_appear_merge = news_appear_merge.drop(columns='Unnamed: 0')


    return news_appear_merge


# ## 2.3 Update the Dataset

# In[77]:


news = parse_cctv(news)
# print(news)

# def write_to_firebase(df):
#     mentions_dict = df.to_dict(orient='records')
#     for row in mentions_dict:
#         date = datetime.datetime.strptime(row['Date'], '%Y-%m-%d')
#         date_str = date.strftime('%B %d, %Y')
#         new_dict = {u'date': row['Date']}
#         # print(date_str)
#         for key in row:
#             if key != 'Date':
#                 # print(key)
#                 new_dict[key] = row[key]
#
#         # print(new_dict)
#         doc_ref = db.collection(u'cctv_mentions').document(date_str)
#         doc_ref.set(new_dict)



# ## 2.4 Store the Dataset

# In[79]:


news.to_csv(r'CCTV_update_data.csv', index=False)
# write_to_firebase(news)
