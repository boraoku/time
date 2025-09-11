Rails.application.routes.draw do
  root "time_converter#index"
  get "up" => "rails/health#show", as: :rails_health_check
end
