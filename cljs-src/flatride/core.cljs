(ns flatride.core
  (:use-macros
   [dommy.macros :only [node sel sel1]])
  (:require
   [dommy.core :as dommy]))


(dommy/append! (sel1 :body) (node [:p "Helloes"]))

